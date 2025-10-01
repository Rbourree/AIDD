import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { TenantEntity, TenantUserEntity } from '../entities/tenant.entity';
import { TenantMapper } from '../mappers/tenant.mapper';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { TenantRole } from '@prisma/client';

@Injectable()
export class TenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new tenant with an owner
   */
  async create(dto: CreateTenantDto, ownerId: string): Promise<TenantEntity> {
    const data = TenantMapper.toPrismaCreate(dto);

    const tenant = await this.prisma.tenant.create({
      data: {
        ...data,
        tenantUsers: {
          create: {
            userId: ownerId,
            role: TenantRole.OWNER,
          },
        },
      },
      include: {
        tenantUsers: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });

    return TenantMapper.toEntity(tenant);
  }

  /**
   * Find tenant by ID
   */
  async findById(id: string): Promise<TenantEntity | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        tenantUsers: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });

    return tenant ? TenantMapper.toEntity(tenant) : null;
  }

  /**
   * Find tenant by slug
   */
  async findBySlug(slug: string): Promise<TenantEntity | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    return tenant ? TenantMapper.toEntity(tenant) : null;
  }

  /**
   * Find all tenants for a user
   */
  async findAllByUserId(userId: string): Promise<TenantEntity[]> {
    const tenants = await this.prisma.tenant.findMany({
      where: {
        tenantUsers: {
          some: {
            userId,
          },
        },
      },
      include: {
        tenantUsers: {
          where: {
            userId,
          },
        },
        _count: {
          select: {
            tenantUsers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tenants.map((tenant) => {
      const myRole = tenant.tenantUsers[0]?.role;
      const memberCount = tenant._count.tenantUsers;
      return new TenantEntity({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
        myRole,
        memberCount,
      });
    });
  }

  /**
   * Update tenant
   */
  async update(id: string, dto: UpdateTenantDto): Promise<TenantEntity> {
    const data = TenantMapper.toPrismaUpdate(dto);

    const tenant = await this.prisma.tenant.update({
      where: { id },
      data,
      include: {
        tenantUsers: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });

    return TenantMapper.toEntity(tenant);
  }

  /**
   * Delete tenant
   */
  async delete(id: string): Promise<void> {
    await this.prisma.tenant.delete({ where: { id } });
  }

  // ==================== TenantUser Methods ====================

  /**
   * Get tenant user relationship
   */
  async getTenantUser(userId: string, tenantId: string): Promise<TenantUserEntity | null> {
    const tenantUser = await this.prisma.tenantUser.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
    });

    return tenantUser ? TenantMapper.toTenantUserEntity(tenantUser) : null;
  }

  /**
   * Get all users in a tenant
   */
  async getTenantUsers(tenantId: string): Promise<TenantUserEntity[]> {
    const tenantUsers = await this.prisma.tenantUser.findMany({
      where: { tenantId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return TenantMapper.toTenantUserEntityArray(tenantUsers);
  }

  /**
   * Add user to tenant
   */
  async addUserToTenant(
    userId: string,
    tenantId: string,
    role: TenantRole,
  ): Promise<TenantUserEntity> {
    const tenantUser = await this.prisma.tenantUser.create({
      data: {
        userId,
        tenantId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return TenantMapper.toTenantUserEntity(tenantUser);
  }

  /**
   * Update user role in tenant
   */
  async updateUserRole(
    userId: string,
    tenantId: string,
    role: TenantRole,
  ): Promise<TenantUserEntity> {
    const tenantUser = await this.prisma.tenantUser.update({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
      data: {
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return TenantMapper.toTenantUserEntity(tenantUser);
  }

  /**
   * Remove user from tenant
   */
  async removeUserFromTenant(userId: string, tenantId: string): Promise<void> {
    await this.prisma.tenantUser.delete({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
    });
  }

  /**
   * Check if user exists in tenant
   */
  async userExistsInTenant(userId: string, tenantId: string): Promise<boolean> {
    const tenantUser = await this.prisma.tenantUser.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
    });

    return !!tenantUser;
  }
}
