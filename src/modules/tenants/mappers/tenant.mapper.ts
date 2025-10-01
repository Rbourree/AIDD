import {
  Tenant as PrismaTenant,
  TenantUser as PrismaTenantUser,
  User as PrismaUser,
  TenantRole,
} from '@prisma/client';
import { TenantEntity, TenantUserEntity } from '../entities/tenant.entity';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';

type PrismaTenantWithRelations = PrismaTenant & {
  tenantUsers?: Array<
    PrismaTenantUser & {
      user: Omit<PrismaUser, 'password'>;
    }
  >;
  _count?: {
    tenantUsers: number;
  };
};

type PrismaTenantUserWithRelations = PrismaTenantUser & {
  user?: Omit<PrismaUser, 'password'>;
  tenant?: PrismaTenant;
};

export class TenantMapper {
  /**
   * Convert Prisma Tenant to TenantEntity
   */
  static toEntity(prismaTenant: PrismaTenantWithRelations, myRole?: TenantRole): TenantEntity {
    return new TenantEntity({
      id: prismaTenant.id,
      name: prismaTenant.name,
      slug: prismaTenant.slug,
      createdAt: prismaTenant.createdAt,
      updatedAt: prismaTenant.updatedAt,
      myRole,
      memberCount: prismaTenant._count?.tenantUsers,
      tenantUsers: prismaTenant.tenantUsers?.map((tu) => ({
        id: tu.id,
        role: tu.role,
        userId: tu.userId,
        user: {
          id: tu.user.id,
          email: tu.user.email,
          firstName: tu.user.firstName,
          lastName: tu.user.lastName,
          createdAt: tu.user.createdAt,
          updatedAt: tu.user.updatedAt,
        },
      })),
    });
  }

  /**
   * Convert array of Prisma Tenants to TenantEntity array
   */
  static toEntityArray(prismaTenants: PrismaTenantWithRelations[]): TenantEntity[] {
    return prismaTenants.map((tenant) => {
      const myRole = tenant.tenantUsers?.[0]?.role;
      return this.toEntity(tenant, myRole);
    });
  }

  /**
   * Convert CreateTenantDto to Prisma create input
   */
  static toPrismaCreate(dto: CreateTenantDto) {
    return {
      name: dto.name,
      slug: dto.slug,
    };
  }

  /**
   * Convert UpdateTenantDto to Prisma update input
   */
  static toPrismaUpdate(dto: UpdateTenantDto) {
    const data: any = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.slug !== undefined) {
      data.slug = dto.slug;
    }

    return data;
  }

  /**
   * Convert Prisma TenantUser to TenantUserEntity
   */
  static toTenantUserEntity(prismaTenantUser: PrismaTenantUserWithRelations): TenantUserEntity {
    return new TenantUserEntity({
      id: prismaTenantUser.id,
      role: prismaTenantUser.role,
      userId: prismaTenantUser.userId,
      tenantId: prismaTenantUser.tenantId,
      createdAt: prismaTenantUser.createdAt,
      updatedAt: prismaTenantUser.updatedAt,
      user: prismaTenantUser.user
        ? {
            id: prismaTenantUser.user.id,
            email: prismaTenantUser.user.email,
            firstName: prismaTenantUser.user.firstName,
            lastName: prismaTenantUser.user.lastName,
            createdAt: prismaTenantUser.user.createdAt,
            updatedAt: prismaTenantUser.user.updatedAt,
          }
        : undefined,
      tenant: prismaTenantUser.tenant,
    });
  }

  /**
   * Convert array of Prisma TenantUsers to TenantUserEntity array
   */
  static toTenantUserEntityArray(
    prismaTenantUsers: PrismaTenantUserWithRelations[],
  ): TenantUserEntity[] {
    return prismaTenantUsers.map((tu) => this.toTenantUserEntity(tu));
  }
}
