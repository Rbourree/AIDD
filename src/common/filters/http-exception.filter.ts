import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'string' ? exceptionResponse : exceptionResponse;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Capture error in Sentry with enriched context
    this.captureErrorInSentry(exception, request, status);

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
    };

    response.status(status).json(errorResponse);
  }

  private captureErrorInSentry(exception: unknown, request: Request, status: number) {
    // Only capture server errors (5xx) and critical client errors
    const shouldCapture = status >= 500 || status === 401 || status === 403;

    if (!shouldCapture) {
      return;
    }

    Sentry.withScope((scope) => {
      // Add user context if available
      const user = (request as any).user;
      if (user) {
        scope.setUser({
          id: user.sub,
          email: user.email,
        });
      }

      // Add tenant context
      if (user?.tenantId) {
        scope.setTag('tenant_id', user.tenantId);
        scope.setContext('tenant', {
          id: user.tenantId,
        });
      }

      // Add request context
      scope.setTag('endpoint', `${request.method} ${request.path}`);
      scope.setTag('http_status', status.toString());
      scope.setContext('request', {
        method: request.method,
        url: request.url,
        path: request.path,
        query: request.query,
        headers: this.sanitizeHeaders(request.headers),
      });

      // Add extra context
      scope.setExtra('request_body', this.sanitizeBody(request.body));
      scope.setExtra('user_agent', request.headers['user-agent']);

      // Capture exception
      if (exception instanceof Error) {
        Sentry.captureException(exception);
      } else {
        Sentry.captureMessage(JSON.stringify(exception), 'error');
      }

      this.logger.error(`Error captured in Sentry: ${status} - ${request.method} ${request.path}`);
    });
  }

  /**
   * Remove sensitive headers before sending to Sentry
   */
  private sanitizeHeaders(headers: any): Record<string, string> {
    const sanitized = { ...headers };
    delete sanitized.authorization;
    delete sanitized.cookie;
    delete sanitized['x-api-key'];
    return sanitized;
  }

  /**
   * Remove sensitive data from request body before sending to Sentry
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'refreshToken'];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
