import { NotFoundException, ForbiddenException } from '@nestjs/common';

export class ItemNotFoundException extends NotFoundException {
  constructor(itemId?: string) {
    super(itemId ? `Item with ID '${itemId}' not found` : 'Item not found');
  }
}

export class ItemForbiddenException extends ForbiddenException {
  constructor(message: string = 'You do not have access to this item') {
    super(message);
  }
}
