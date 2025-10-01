import {
  User as PrismaUser,
  TenantUser as PrismaTenantUser,
  Tenant as PrismaTenant,
} from '@prisma/client';
import { UserEntity } from '../entities/user.entity';
import { UpdateUserDto } from '../dto/update-user.dto';

type PrismaUserWithRelations = PrismaUser & {
  tenantUsers?: Array<
    PrismaTenantUser & {
      tenant: PrismaTenant;
    }
  >;
};

export class UserMapper {
  /**
   * Convert Prisma User to UserEntity (excluding password)
   */
  static toEntity(prismaUser: PrismaUserWithRelations): UserEntity {
    return new UserEntity({
      id: prismaUser.id,
      email: prismaUser.email,
      firstName: prismaUser.firstName,
      lastName: prismaUser.lastName,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
      tenantUsers: prismaUser.tenantUsers?.map((tu) => ({
        id: tu.id,
        role: tu.role,
        tenantId: tu.tenantId,
        tenant: {
          id: tu.tenant.id,
          name: tu.tenant.name,
          slug: tu.tenant.slug,
          createdAt: tu.tenant.createdAt,
        },
      })),
    });
  }

  /**
   * Convert array of Prisma Users to UserEntity array
   */
  static toEntityArray(prismaUsers: PrismaUserWithRelations[]): UserEntity[] {
    return prismaUsers.map((user) => this.toEntity(user));
  }

  /**
   * Convert UpdateUserDto to Prisma update input
   */
  static toPrismaUpdate(dto: UpdateUserDto) {
    const data: any = {};

    if (dto.email !== undefined) {
      data.email = dto.email;
    }

    if (dto.firstName !== undefined) {
      data.firstName = dto.firstName;
    }

    if (dto.lastName !== undefined) {
      data.lastName = dto.lastName;
    }

    return data;
  }

  /**
   * Exclude password from Prisma User
   */
  static excludePassword(user: PrismaUser): Omit<PrismaUser, 'password'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
