import { NotFoundException, BadRequestException } from '@nestjs/common';

export class InvitationNotFoundException extends NotFoundException {
  constructor(token?: string) {
    super(token ? `Invitation with token '${token}' not found` : 'Invitation not found');
  }
}

export class InvitationAlreadyAcceptedException extends BadRequestException {
  constructor() {
    super('This invitation has already been accepted');
  }
}

export class InvitationExpiredException extends BadRequestException {
  constructor() {
    super('This invitation has expired');
  }
}

export class InvitationInvalidException extends BadRequestException {
  constructor(message: string = 'Invalid invitation') {
    super(message);
  }
}
