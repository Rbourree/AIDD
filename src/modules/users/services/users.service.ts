import { Injectable } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { User } from '../entities/user.entity';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { PaginationDto } from '@common/dtos/pagination.dto';
import { PaginatedResponse } from '@common/interfaces/paginated-response.interface';
import {
  UserNotFoundException,
  UserEmailAlreadyExistsException,
  UserIncorrectPasswordException,
  UserNoTenantAccessException,
} from '../exceptions/user.exceptions';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async findMe(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundException(userId);
    }

    return user;
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponse<User>> {
    const { page, limit, search } = paginationDto;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userRepository.findAll({ skip, take: limit, search }),
      this.userRepository.count(search),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new UserNotFoundException(id);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new UserNotFoundException(id);
    }

    // Check if email is being changed and if it's already in use
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(updateUserDto.email);

      if (existingUser) {
        throw new UserEmailAlreadyExistsException(updateUserDto.email);
      }
    }

    return this.userRepository.update(id, updateUserDto);
  }

  async remove(id: string): Promise<{ message: string }> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new UserNotFoundException(id);
    }

    await this.userRepository.delete(id);

    return { message: 'User deleted successfully' };
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findByIdWithPassword(userId);

    if (!user) {
      throw new UserNotFoundException(userId);
    }

    const isPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);

    if (!isPasswordValid) {
      throw new UserIncorrectPasswordException();
    }

    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 12);

    await this.userRepository.updatePassword(userId, hashedPassword);

    return { message: 'Password changed successfully' };
  }

  async getUserTenants(userId: string) {
    return this.userRepository.getUserTenants(userId);
  }

  async switchTenant(userId: string, tenantId: string): Promise<{ tenantId: string }> {
    const hasAccess = await this.userRepository.hasTenantAccess(userId, tenantId);

    if (!hasAccess) {
      throw new UserNoTenantAccessException(tenantId);
    }

    return { tenantId };
  }
}
