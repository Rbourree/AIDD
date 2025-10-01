import { HttpException, HttpStatus } from '@nestjs/common';

export class Ar24ConfigurationException extends HttpException {
  constructor(message: string) {
    super(`AR24 configuration error: ${message}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class Ar24AuthenticationException extends HttpException {
  constructor(reason?: string) {
    const message = reason
      ? `AR24 authentication failed: ${reason}`
      : 'AR24 authentication failed';
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class Ar24RequestTimeoutException extends HttpException {
  constructor() {
    super(
      'AR24 request timestamp out of allowed window (must be within 10 minutes)',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class Ar24MailSendException extends HttpException {
  constructor(reason?: string) {
    const message = reason
      ? `Failed to send AR24 registered mail: ${reason}`
      : 'Failed to send AR24 registered mail';
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class Ar24MailNotFoundException extends HttpException {
  constructor(mailId: string) {
    super(`AR24 registered mail with ID '${mailId}' not found`, HttpStatus.NOT_FOUND);
  }
}

export class Ar24AttachmentUploadException extends HttpException {
  constructor(filename: string, reason?: string) {
    const message = reason
      ? `Failed to upload attachment '${filename}': ${reason}`
      : `Failed to upload attachment '${filename}'`;
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class Ar24AttachmentSizeException extends HttpException {
  constructor(size: number) {
    super(
      `Attachment size (${size} bytes) exceeds AR24 limit of 256MB`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class Ar24ProofNotFoundException extends HttpException {
  constructor(proofType: string, mailId: string) {
    super(
      `Proof '${proofType}' not available for mail '${mailId}'`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class Ar24WebhookException extends HttpException {
  constructor(reason?: string) {
    const message = reason
      ? `AR24 webhook operation failed: ${reason}`
      : 'AR24 webhook operation failed';
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class Ar24RateLimitException extends HttpException {
  constructor() {
    super('AR24 API rate limit exceeded. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
  }
}

export class Ar24ApiException extends HttpException {
  constructor(statusCode: number, message: string) {
    super(`AR24 API error: ${message}`, statusCode);
  }
}
