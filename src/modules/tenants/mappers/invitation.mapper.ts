import { Invitation as PrismaInvitation } from '@prisma/client';
import { InvitationEntity } from '../entities/invitation.entity';

type PrismaInvitationWithRelations = PrismaInvitation & {
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
  inviter?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
};

export class InvitationMapper {
  /**
   * Convert Prisma Invitation to InvitationEntity
   */
  static toEntity(prismaInvitation: PrismaInvitationWithRelations): InvitationEntity {
    return new InvitationEntity({
      id: prismaInvitation.id,
      email: prismaInvitation.email,
      token: prismaInvitation.token,
      role: prismaInvitation.role,
      expiresAt: prismaInvitation.expiresAt,
      accepted: prismaInvitation.accepted,
      tenantId: prismaInvitation.tenantId,
      invitedBy: prismaInvitation.invitedBy,
      createdAt: prismaInvitation.createdAt,
      updatedAt: prismaInvitation.updatedAt,
      tenant: prismaInvitation.tenant,
      inviter: prismaInvitation.inviter,
    });
  }

  /**
   * Convert array of Prisma Invitations to InvitationEntity array
   */
  static toEntityArray(prismaInvitations: PrismaInvitationWithRelations[]): InvitationEntity[] {
    return prismaInvitations.map((invitation) => this.toEntity(invitation));
  }
}
