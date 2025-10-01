import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as Sentry from '@sentry/node';

/**
 * Sentry interceptor to enrich error context with user and tenant information
 * This interceptor runs on every request to set up Sentry scope with contextual data
 */
@Injectable()
export class SentryInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SentryInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Set up Sentry scope for this request
    Sentry.getCurrentScope().setContext('request', {
      method: request.method,
      url: request.url,
      path: request.path,
    });

    // Add user context if authenticated
    if (user) {
      Sentry.getCurrentScope().setUser({
        id: user.sub,
        email: user.email,
      });

      // Add tenant context if available
      if (user.tenantId) {
        Sentry.getCurrentScope().setTag('tenant_id', user.tenantId);
        Sentry.getCurrentScope().setContext('tenant', {
          id: user.tenantId,
        });
      }

      // Add user role if available
      if (user.role) {
        Sentry.getCurrentScope().setTag('user_role', user.role);
      }
    }

    // Add breadcrumb for the request
    Sentry.addBreadcrumb({
      category: 'http',
      message: `${request.method} ${request.path}`,
      level: 'info',
      data: {
        url: request.url,
        method: request.method,
        query: request.query,
      },
    });

    return next.handle().pipe(
      tap({
        next: () => {
          // Request succeeded - add success breadcrumb
          Sentry.addBreadcrumb({
            category: 'http.response',
            message: `${request.method} ${request.path} - Success`,
            level: 'info',
          });
        },
        error: (error) => {
          // Error will be caught by HttpExceptionFilter
          this.logger.debug(`Request ${request.method} ${request.path} failed: ${error.message}`);
        },
      }),
    );
  }
}
