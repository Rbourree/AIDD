import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { TenantRepository } from '../../modules/tenants/repositories/tenant.repository';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class TenantRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private tenantRepository: TenantRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<TenantRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;
    const tenantId = request.params.tenantId || request.params.id || request.body.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('Tenant ID is required');
    }

    const tenantUser = await this.tenantRepository.getTenantUser(user.sub, tenantId);

    if (!tenantUser) {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    if (!requiredRoles.includes(tenantUser.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
