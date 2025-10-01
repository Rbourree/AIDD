import { UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';

export class AuthInvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super('Invalid credentials');
  }
}

export class AuthUserHasNoTenantsException extends UnauthorizedException {
  constructor() {
    super('User has no associated tenants');
  }
}

export class AuthInvalidRefreshTokenException extends UnauthorizedException {
  constructor() {
    super('Invalid refresh token');
  }
}

export class AuthUserAlreadyExistsException extends ConflictException {
  constructor(email: string) {
    super(`User with email '${email}' already exists`);
  }
}

export class AuthPasswordRequiredException extends BadRequestException {
  constructor() {
    super('Password is required for new users');
  }
}

export class AuthTenantNotFoundException extends BadRequestException {
  constructor(tenantId: string) {
    super(`Tenant '${tenantId}' not found`);
  }
}
