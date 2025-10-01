import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { UserEntity } from '../entities/user.entity';
import { UserMapper } from '../mappers/user.mapper';
import { UpdateUserDto } from '../dto/update-user.dto';

export interface FindAllUsersOptions {
  skip?: number;
  take?: number;
  search?: string;
}

export interface TenantWithRole {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  role: string;
}

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        tenantUsers: {
          include: {
            tenant: true,
          },
        },
      },
    });

    return user ? UserMapper.toEntity(user) : null;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        tenantUsers: {
          include: {
            tenant: true,
          },
        },
      },
    });

    return user ? UserMapper.toEntity(user) : null;
  }

  /**
   * Find user by email with password (for authentication)
   */
  async findByEmailWithPassword(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find user by ID with password (for password change)
   */
  async findByIdWithPassword(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find all users with pagination and filtering
   */
  async findAll(options: FindAllUsersOptions): Promise<UserEntity[]> {
    const { skip, take, search } = options;

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const users = await this.prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    return UserMapper.toEntityArray(users);
  }

  /**
   * Count users with filtering
   */
  async count(search?: string): Promise<number> {
    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    return this.prisma.user.count({ where });
  }

  /**
   * Update user
   */
  async update(id: string, dto: UpdateUserDto): Promise<UserEntity> {
    const data = UserMapper.toPrismaUpdate(dto);

    const user = await this.prisma.user.update({
      where: { id },
      data,
    });

    return UserMapper.toEntity(user);
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Get user's tenants with roles
   */
  async getUserTenants(userId: string): Promise<TenantWithRole[]> {
    const tenantUsers = await this.prisma.tenantUser.findMany({
      where: { userId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return tenantUsers.map((tu) => ({
      ...tu.tenant,
      role: tu.role,
    }));
  }

  /**
   * Check if user has access to tenant
   */
  async hasTenantAccess(userId: string, tenantId: string): Promise<boolean> {
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
