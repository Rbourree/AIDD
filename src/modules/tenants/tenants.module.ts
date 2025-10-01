import { Module } from '@nestjs/common';
import { TenantsService } from './services/tenants.service';
import { TenantsController } from './controllers/tenants.controller';
import { TenantRepository } from './repositories/tenant.repository';
import { InvitationRepository } from './repositories/invitation.repository';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../../common/integrations/mail/mail.module';

@Module({
  imports: [UsersModule, MailModule],
  controllers: [TenantsController],
  providers: [TenantsService, TenantRepository, InvitationRepository],
  exports: [TenantsService, TenantRepository, InvitationRepository],
})
export class TenantsModule {}
