import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Invitation } from '../entities/invitation.entity';
import { TenantRole } from '../enums/tenant-role.enum';

export interface CreateInvitationData {
  email: string;
  token: string;
  role: TenantRole;
  expiresAt: Date;
  tenantId: string;
  invitedBy: string;
}

@Injectable()
export class InvitationRepository {
  constructor(
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
  ) {}

  /**
   * Create a new invitation
   */
  async create(data: CreateInvitationData): Promise<Invitation> {
    const invitation = this.invitationRepository.create(data);
    await this.invitationRepository.save(invitation);

    return this.invitationRepository.findOne({
      where: { id: invitation.id },
      relations: ['tenant', 'inviter'],
    });
  }

  /**
   * Find invitation by token
   */
  async findByToken(token: string): Promise<Invitation | null> {
    return this.invitationRepository.findOne({
      where: { token },
      relations: ['tenant', 'inviter'],
    });
  }

  /**
   * Find invitation by ID
   */
  async findById(id: string): Promise<Invitation | null> {
    return this.invitationRepository.findOne({
      where: { id },
      relations: ['tenant', 'inviter'],
    });
  }

  /**
   * Find all pending invitations for a tenant
   */
  async findPendingByTenantId(tenantId: string): Promise<Invitation[]> {
    return this.invitationRepository.find({
      where: {
        tenantId,
        accepted: false,
      },
      relations: ['inviter'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find pending invitation by email and tenant
   */
  async findPendingByEmailAndTenant(
    email: string,
    tenantId: string,
  ): Promise<Invitation | null> {
    return this.invitationRepository.findOne({
      where: {
        email,
        tenantId,
        accepted: false,
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  /**
   * Mark invitation as accepted
   */
  async markAsAccepted(id: string): Promise<void> {
    await this.invitationRepository.update(id, { accepted: true });
  }

  /**
   * Delete invitation
   */
  async delete(id: string): Promise<void> {
    await this.invitationRepository.delete(id);
  }
}
