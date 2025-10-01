import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TenantRepository } from '../repositories/tenant.repository';
import { InvitationRepository } from '../repositories/invitation.repository';
import { UserRepository } from '../../users/repositories/user.repository';
import { MailService } from '../../../common/services/mail/mail.service';
import { TenantEntity, TenantUserEntity } from '../entities/tenant.entity';
import { InvitationEntity } from '../entities/invitation.entity';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { AddUserToTenantDto } from '../dto/add-user-to-tenant.dto';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto';
import { CreateInvitationDto } from '../dto/create-invitation.dto';
import {
  TenantNotFoundException,
  TenantSlugAlreadyExistsException,
  TenantAccessDeniedException,
  InsufficientTenantPermissionsException,
  UserAlreadyInTenantException,
  CannotModifyOwnerException,
  CannotSetOwnerRoleException,
  UserNotInTenantException,
  UserAlreadyMemberException,
  PendingInvitationExistsException,
  InvitationSendFailedException,
  InvitationNotBelongToTenantException,
  CannotCancelAcceptedInvitationException,
} from '../exceptions/tenant.exceptions';
import { UserNotFoundException } from '../../users/exceptions/user.exceptions';
import {
  InvitationNotFoundException,
  InvitationAlreadyAcceptedException,
  InvitationExpiredException,
} from '../exceptions/invitation.exceptions';
import { TenantRole } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TenantsService {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly invitationRepository: InvitationRepository,
    private readonly userRepository: UserRepository,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  // ==================== Tenant CRUD ====================

  async create(createTenantDto: CreateTenantDto, userId: string): Promise<TenantEntity> {
    // Check if slug already exists
    const existingTenant = await this.tenantRepository.findBySlug(createTenantDto.slug);

    if (existingTenant) {
      throw new TenantSlugAlreadyExistsException(createTenantDto.slug);
    }

    return this.tenantRepository.create(createTenantDto, userId);
  }

  async findAll(userId: string): Promise<TenantEntity[]> {
    return this.tenantRepository.findAllByUserId(userId);
  }

  async findOne(id: string, userId: string): Promise<TenantEntity> {
    const tenant = await this.tenantRepository.findById(id);

    if (!tenant) {
      throw new TenantNotFoundException(id);
    }

    // Check if user has access to this tenant
    const userAccess = await this.tenantRepository.getTenantUser(userId, id);
    if (!userAccess) {
      throw new TenantAccessDeniedException();
    }

    tenant.myRole = userAccess.role;
    return tenant;
  }

  async update(
    id: string,
    updateTenantDto: UpdateTenantDto,
    userId: string,
  ): Promise<TenantEntity> {
    const tenant = await this.tenantRepository.findById(id);

    if (!tenant) {
      throw new TenantNotFoundException(id);
    }

    // Check if user has access and is OWNER or ADMIN
    const userAccess = await this.tenantRepository.getTenantUser(userId, id);
    if (!userAccess) {
      throw new TenantAccessDeniedException();
    }

    if (userAccess.role !== TenantRole.OWNER && userAccess.role !== TenantRole.ADMIN) {
      throw new InsufficientTenantPermissionsException('OWNER or ADMIN');
    }

    // Check if new slug is unique
    if (updateTenantDto.slug && updateTenantDto.slug !== tenant.slug) {
      const existingTenant = await this.tenantRepository.findBySlug(updateTenantDto.slug);

      if (existingTenant) {
        throw new TenantSlugAlreadyExistsException(updateTenantDto.slug);
      }
    }

    return this.tenantRepository.update(id, updateTenantDto);
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const tenant = await this.tenantRepository.findById(id);

    if (!tenant) {
      throw new TenantNotFoundException(id);
    }

    // Check if user has access and is OWNER
    const userAccess = await this.tenantRepository.getTenantUser(userId, id);
    if (!userAccess) {
      throw new TenantAccessDeniedException();
    }

    if (userAccess.role !== TenantRole.OWNER) {
      throw new InsufficientTenantPermissionsException('OWNER');
    }

    await this.tenantRepository.delete(id);

    return { message: 'Tenant deleted successfully' };
  }

  // ==================== Tenant User Management ====================

  async getTenantUsers(tenantId: string, userId: string): Promise<TenantUserEntity[]> {
    // Check if user has access to this tenant
    const userAccess = await this.tenantRepository.getTenantUser(userId, tenantId);

    if (!userAccess) {
      throw new TenantAccessDeniedException();
    }

    return this.tenantRepository.getTenantUsers(tenantId);
  }

  async addUserToTenant(
    tenantId: string,
    addUserDto: AddUserToTenantDto,
    requestUserId: string,
  ): Promise<TenantUserEntity> {
    // Check if requesting user has access and is OWNER or ADMIN
    const requestUserAccess = await this.tenantRepository.getTenantUser(requestUserId, tenantId);

    if (!requestUserAccess) {
      throw new TenantAccessDeniedException();
    }

    if (
      requestUserAccess.role !== TenantRole.OWNER &&
      requestUserAccess.role !== TenantRole.ADMIN
    ) {
      throw new InsufficientTenantPermissionsException('OWNER or ADMIN');
    }

    // Check if user exists
    const user = await this.userRepository.findById(addUserDto.userId);

    if (!user) {
      throw new UserNotFoundException(addUserDto.userId);
    }

    // Check if user is already in tenant
    const existingAccess = await this.tenantRepository.userExistsInTenant(
      addUserDto.userId,
      tenantId,
    );

    if (existingAccess) {
      throw new UserAlreadyInTenantException();
    }

    return this.tenantRepository.addUserToTenant(addUserDto.userId, tenantId, addUserDto.role);
  }

  async updateUserRole(
    tenantId: string,
    userId: string,
    updateRoleDto: UpdateUserRoleDto,
    requestUserId: string,
  ): Promise<TenantUserEntity> {
    // Check if requesting user has access and is OWNER or ADMIN
    const requestUserAccess = await this.tenantRepository.getTenantUser(requestUserId, tenantId);

    if (!requestUserAccess) {
      throw new TenantAccessDeniedException();
    }

    if (
      requestUserAccess.role !== TenantRole.OWNER &&
      requestUserAccess.role !== TenantRole.ADMIN
    ) {
      throw new InsufficientTenantPermissionsException('OWNER or ADMIN');
    }

    // Check if target user exists in tenant
    const targetUserAccess = await this.tenantRepository.getTenantUser(userId, tenantId);

    if (!targetUserAccess) {
      throw new UserNotInTenantException();
    }

    // Prevent changing OWNER role
    if (targetUserAccess.role === TenantRole.OWNER) {
      throw new CannotModifyOwnerException();
    }

    // Prevent setting new role to OWNER
    if (updateRoleDto.role === TenantRole.OWNER) {
      throw new CannotSetOwnerRoleException();
    }

    return this.tenantRepository.updateUserRole(userId, tenantId, updateRoleDto.role);
  }

  async removeUserFromTenant(
    tenantId: string,
    userId: string,
    requestUserId: string,
  ): Promise<{ message: string }> {
    // Check if requesting user has access and is OWNER or ADMIN
    const requestUserAccess = await this.tenantRepository.getTenantUser(requestUserId, tenantId);

    if (!requestUserAccess) {
      throw new TenantAccessDeniedException();
    }

    if (
      requestUserAccess.role !== TenantRole.OWNER &&
      requestUserAccess.role !== TenantRole.ADMIN
    ) {
      throw new InsufficientTenantPermissionsException('OWNER or ADMIN');
    }

    // Check if target user exists in tenant
    const targetUserAccess = await this.tenantRepository.getTenantUser(userId, tenantId);

    if (!targetUserAccess) {
      throw new UserNotInTenantException();
    }

    // Prevent removing OWNER
    if (targetUserAccess.role === TenantRole.OWNER) {
      throw new CannotModifyOwnerException();
    }

    await this.tenantRepository.removeUserFromTenant(userId, tenantId);

    return { message: 'User removed from tenant successfully' };
  }

  // ==================== Invitation Management ====================

  async createInvitation(
    tenantId: string,
    createInvitationDto: CreateInvitationDto,
    invitedBy: string,
  ): Promise<InvitationEntity> {
    // Check if requesting user has access and is OWNER or ADMIN
    const requestUserAccess = await this.tenantRepository.getTenantUser(invitedBy, tenantId);

    if (!requestUserAccess) {
      throw new TenantAccessDeniedException();
    }

    if (
      requestUserAccess.role !== TenantRole.OWNER &&
      requestUserAccess.role !== TenantRole.ADMIN
    ) {
      throw new InsufficientTenantPermissionsException('OWNER or ADMIN');
    }

    // Get tenant details
    const tenant = await this.tenantRepository.findById(tenantId);

    if (!tenant) {
      throw new TenantNotFoundException(tenantId);
    }

    // Check if email is already a tenant member
    const existingUser = await this.userRepository.findByEmail(createInvitationDto.email);

    if (existingUser) {
      const hasAccess = await this.tenantRepository.userExistsInTenant(existingUser.id, tenantId);
      if (hasAccess) {
        throw new UserAlreadyMemberException();
      }
    }

    // Check if there's already a pending invitation for this email
    const existingInvitation = await this.invitationRepository.findPendingByEmailAndTenant(
      createInvitationDto.email,
      tenantId,
    );

    if (existingInvitation) {
      throw new PendingInvitationExistsException();
    }

    // Generate UUID token
    const token = uuidv4();

    // Set expiration to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create invitation in database
    const invitation = await this.invitationRepository.create({
      email: createInvitationDto.email,
      token,
      role: createInvitationDto.role || TenantRole.MEMBER,
      expiresAt,
      tenantId,
      invitedBy,
    });

    // Get inviter name for email
    const inviterName = invitation.getInviterDisplayName();

    // Get invitation base URL from config
    const invitationBaseUrl = this.configService.get<string>('invitation.baseUrl');
    const invitationLink = `${invitationBaseUrl}?token=${token}`;

    // Send invitation email
    try {
      await this.mailService.sendInvitationEmail({
        toEmail: invitation.email,
        tenantName: tenant.name,
        inviterName,
        invitationLink,
      });
    } catch (error) {
      // If email fails, delete the invitation and throw error
      await this.invitationRepository.delete(invitation.id);
      throw new InvitationSendFailedException();
    }

    return invitation;
  }

  async getInvitations(tenantId: string, userId: string): Promise<InvitationEntity[]> {
    // Check if user has access to this tenant
    const userAccess = await this.tenantRepository.getTenantUser(userId, tenantId);

    if (!userAccess) {
      throw new TenantAccessDeniedException();
    }

    if (userAccess.role !== TenantRole.OWNER && userAccess.role !== TenantRole.ADMIN) {
      throw new InsufficientTenantPermissionsException('OWNER or ADMIN');
    }

    return this.invitationRepository.findPendingByTenantId(tenantId);
  }

  async cancelInvitation(
    tenantId: string,
    invitationId: string,
    userId: string,
  ): Promise<{ message: string }> {
    // Check if requesting user has access and is OWNER or ADMIN
    const requestUserAccess = await this.tenantRepository.getTenantUser(userId, tenantId);

    if (!requestUserAccess) {
      throw new TenantAccessDeniedException();
    }

    if (
      requestUserAccess.role !== TenantRole.OWNER &&
      requestUserAccess.role !== TenantRole.ADMIN
    ) {
      throw new InsufficientTenantPermissionsException('OWNER or ADMIN');
    }

    // Find the invitation
    const invitation = await this.invitationRepository.findById(invitationId);

    if (!invitation) {
      throw new InvitationNotFoundException(invitationId);
    }

    // Verify invitation belongs to tenant
    if (invitation.tenantId !== tenantId) {
      throw new InvitationNotBelongToTenantException();
    }

    // Verify invitation is not already accepted
    if (invitation.accepted) {
      throw new CannotCancelAcceptedInvitationException();
    }

    await this.invitationRepository.delete(invitationId);

    return { message: 'Invitation cancelled successfully' };
  }

  async getInvitationByToken(token: string): Promise<InvitationEntity> {
    // Find invitation by token
    const invitation = await this.invitationRepository.findByToken(token);

    if (!invitation) {
      throw new InvitationNotFoundException(token);
    }

    // Check if already accepted
    if (invitation.accepted) {
      throw new InvitationAlreadyAcceptedException();
    }

    // Check if expired
    if (invitation.isExpired()) {
      throw new InvitationExpiredException();
    }

    return invitation;
  }
}
