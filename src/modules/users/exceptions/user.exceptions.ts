import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';

export class UserNotFoundException extends NotFoundException {
  constructor(userId?: string) {
    super(userId ? `User with ID '${userId}' not found` : 'User not found');
  }
}

export class UserEmailAlreadyExistsException extends ConflictException {
  constructor(email: string) {
    super(`User with email '${email}' already exists`);
  }
}

export class UserIncorrectPasswordException extends UnauthorizedException {
  constructor() {
    super('Current password is incorrect');
  }
}

export class UserNoTenantAccessException extends BadRequestException {
  constructor(tenantId: string) {
    super(`You do not have access to tenant '${tenantId}'`);
  }
}
