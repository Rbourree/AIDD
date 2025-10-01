import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { InvitationEntity } from '../entities/invitation.entity';
import { InvitationMapper } from '../mappers/invitation.mapper';
import { TenantRole } from '@prisma/client';

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
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new invitation
   */
  async create(data: CreateInvitationData): Promise<InvitationEntity> {
    const invitation = await this.prisma.invitation.create({
      data,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        inviter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return InvitationMapper.toEntity(invitation);
  }

  /**
   * Find invitation by token
   */
  async findByToken(token: string): Promise<InvitationEntity | null> {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        inviter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return invitation ? InvitationMapper.toEntity(invitation) : null;
  }

  /**
   * Find invitation by ID
   */
  async findById(id: string): Promise<InvitationEntity | null> {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        inviter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return invitation ? InvitationMapper.toEntity(invitation) : null;
  }

  /**
   * Find all pending invitations for a tenant
   */
  async findPendingByTenantId(tenantId: string): Promise<InvitationEntity[]> {
    const invitations = await this.prisma.invitation.findMany({
      where: {
        tenantId,
        accepted: false,
      },
      include: {
        inviter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return InvitationMapper.toEntityArray(invitations);
  }

  /**
   * Find pending invitation by email and tenant
   */
  async findPendingByEmailAndTenant(
    email: string,
    tenantId: string,
  ): Promise<InvitationEntity | null> {
    const invitation = await this.prisma.invitation.findFirst({
      where: {
        email,
        tenantId,
        accepted: false,
        expiresAt: {
          gte: new Date(),
        },
      },
    });

    return invitation ? InvitationMapper.toEntity(invitation) : null;
  }

  /**
   * Mark invitation as accepted
   */
  async markAsAccepted(id: string): Promise<void> {
    await this.prisma.invitation.update({
      where: { id },
      data: { accepted: true },
    });
  }

  /**
   * Delete invitation
   */
  async delete(id: string): Promise<void> {
    await this.prisma.invitation.delete({
      where: { id },
    });
  }
}
