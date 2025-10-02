import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsService } from './services/tenants.service';
import { TenantsController } from './controllers/tenants.controller';
import { TenantRepository } from './repositories/tenant.repository';
import { InvitationRepository } from './repositories/invitation.repository';
import { Tenant } from './entities/tenant.entity';
import { TenantUser } from './entities/tenant-user.entity';
import { Invitation } from './entities/invitation.entity';
import { UsersModule } from '@modules/users/users.module';
import { MailModule } from '@common/integrations/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, TenantUser, Invitation]),
    UsersModule,
    MailModule,
  ],
  controllers: [TenantsController],
  providers: [TenantsService, TenantRepository, InvitationRepository],
  exports: [TenantsService, TenantRepository, InvitationRepository, TypeOrmModule],
})
export class TenantsModule {}
