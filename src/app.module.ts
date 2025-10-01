import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { SentryModule } from '@ntegral/nestjs-sentry';
import { ConfigModule } from '@config/config.module';
import { DatabaseModule } from '@database/database.module';
import { MailModule } from '@common/integrations/mail/mail.module';
import { HealthModule } from '@modules/health/health.module';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { TenantsModule } from '@modules/tenants/tenants.module';
import { ItemsModule } from '@modules/items/items.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    MailModule,
    ThrottlerModule.forRootAsync({
      imports: [NestConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('throttle.ttl') || 60000,
          limit: config.get('throttle.limit') || 100,
        },
      ],
    }),
    SentryModule.forRootAsync({
      imports: [NestConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        dsn: config.get('sentry.dsn'),
        environment: config.get('nodeEnv'),
        enabled: !!config.get('sentry.dsn'),
        release: config.get('sentry.release'),
        // Performance Monitoring
        tracesSampleRate: config.get('sentry.tracesSampleRate') || 0.1,
        profilesSampleRate: config.get('sentry.profilesSampleRate') || 0.0,
        // Privacy & Security
        beforeSend(event, hint) {
          // Filter sensitive data
          if (event.request?.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
          }

          // Don't send validation errors (400)
          if (event.exception?.values?.[0]?.value?.includes('validation')) {
            return null;
          }

          return event;
        },
        // Integrations
        integrations: [],
      }),
    }),
    HealthModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    ItemsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
