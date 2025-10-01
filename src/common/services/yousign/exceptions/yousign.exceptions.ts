import { HttpException, HttpStatus } from '@nestjs/common';

export class YousignApiException extends HttpException {
  constructor(message: string, statusCode: number = HttpStatus.BAD_GATEWAY) {
    super(`Yousign API Error: ${message}`, statusCode);
  }
}

export class YousignAuthenticationException extends HttpException {
  constructor(message: string = 'Invalid or missing Yousign API key') {
    super(`Yousign Authentication Error: ${message}`, HttpStatus.UNAUTHORIZED);
  }
}

export class YousignDocumentUploadException extends HttpException {
  constructor(filename: string, reason?: string) {
    const message = reason
      ? `Failed to upload document '${filename}': ${reason}`
      : `Failed to upload document '${filename}'`;
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class YousignSignatureRequestNotFoundException extends HttpException {
  constructor(signatureRequestId: string) {
    super(
      `Signature request with ID '${signatureRequestId}' not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class YousignSignerNotFoundException extends HttpException {
  constructor(signerId: string) {
    super(`Signer with ID '${signerId}' not found`, HttpStatus.NOT_FOUND);
  }
}

export class YousignInvalidRequestException extends HttpException {
  constructor(message: string) {
    super(`Invalid Yousign request: ${message}`, HttpStatus.BAD_REQUEST);
  }
}

export class YousignRateLimitException extends HttpException {
  constructor() {
    super('Yousign API rate limit exceeded. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
  }
}

export class YousignDocumentDownloadException extends HttpException {
  constructor(documentId: string, reason?: string) {
    const message = reason
      ? `Failed to download document '${documentId}': ${reason}`
      : `Failed to download document '${documentId}'`;
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class YousignSignatureRequestNotReadyException extends HttpException {
  constructor(status: string) {
    super(
      `Signature request is not ready. Current status: ${status}`,
      HttpStatus.PRECONDITION_FAILED,
    );
  }
}
