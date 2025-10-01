import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

// ==================== Tenant Exceptions ====================

export class TenantNotFoundException extends NotFoundException {
  constructor(tenantId?: string) {
    super(tenantId ? `Tenant with ID '${tenantId}' not found` : 'Tenant not found');
  }
}

export class TenantSlugAlreadyExistsException extends ConflictException {
  constructor(slug: string) {
    super(`Tenant with slug '${slug}' already exists`);
  }
}

export class TenantAccessDeniedException extends ForbiddenException {
  constructor(message: string = 'You do not have access to this tenant') {
    super(message);
  }
}

export class InsufficientTenantPermissionsException extends ForbiddenException {
  constructor(requiredRole: string) {
    super(`Only ${requiredRole} can perform this action`);
  }
}

// ==================== Tenant User Management Exceptions ====================

export class UserAlreadyInTenantException extends BadRequestException {
  constructor() {
    super('User is already a member of this tenant');
  }
}

export class CannotModifyOwnerException extends BadRequestException {
  constructor() {
    super('Cannot change or remove OWNER role');
  }
}

export class CannotSetOwnerRoleException extends BadRequestException {
  constructor() {
    super('Cannot set user as OWNER. Transfer ownership instead.');
  }
}

export class UserNotInTenantException extends NotFoundException {
  constructor() {
    super('User is not a member of this tenant');
  }
}

// ==================== Invitation Exceptions ====================

export class UserAlreadyMemberException extends BadRequestException {
  constructor() {
    super('This user is already a member of the tenant');
  }
}

export class PendingInvitationExistsException extends BadRequestException {
  constructor() {
    super('There is already a pending invitation for this email');
  }
}

export class InvitationSendFailedException extends BadRequestException {
  constructor() {
    super('Failed to send invitation email');
  }
}

export class InvitationNotBelongToTenantException extends ForbiddenException {
  constructor() {
    super('This invitation does not belong to the specified tenant');
  }
}

export class CannotCancelAcceptedInvitationException extends BadRequestException {
  constructor() {
    super('Cannot cancel an invitation that has already been accepted');
  }
}
