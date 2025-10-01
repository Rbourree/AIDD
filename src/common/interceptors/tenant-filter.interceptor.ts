import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Interceptor that automatically filters queries by user's tenant ID
 * This is used to enforce multi-tenant isolation at the query level
 */
@Injectable()
export class TenantFilterInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user && user.tenantId) {
      request.tenantId = user.tenantId;
    }

    return next.handle();
  }
}
