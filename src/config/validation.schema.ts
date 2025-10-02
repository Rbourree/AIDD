import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Database (TypeORM)
  DATABASE_HOST: Joi.string().default('localhost'),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_SSL: Joi.string().valid('true', 'false').default('false'),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION: Joi.string().default('7d'),
  REFRESH_TOKEN_SECRET: Joi.string().required(),
  REFRESH_TOKEN_EXPIRATION: Joi.string().default('30d'),

  // Application
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

  // CORS
  CORS_ORIGIN: Joi.string().required(),
  MAILJET_API_KEY: Joi.string().required(),
  MAILJET_SECRET_KEY: Joi.string().required(),
  MAILJET_SENDER_EMAIL: Joi.string().email().required(),
  MAILJET_SENDER_NAME: Joi.string().required(),
  INVITATION_BASE_URL: Joi.string().uri().required(),
  SENTRY_DSN: Joi.string().allow(''),
  SENTRY_RELEASE: Joi.string().allow(''),
  SENTRY_TRACES_SAMPLE_RATE: Joi.number().min(0).max(1).default(0.1),
  SENTRY_PROFILES_SAMPLE_RATE: Joi.number().min(0).max(1).default(0.0),
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),
  YOUSIGN_API_KEY: Joi.string().allow(''),
  YOUSIGN_ENVIRONMENT: Joi.string().valid('sandbox', 'production').default('sandbox'),
  AR24_TOKEN: Joi.string().allow(''),
  AR24_PRIVATE_KEY: Joi.string().allow(''),
  AR24_ENVIRONMENT: Joi.string().valid('sandbox', 'production').default('sandbox'),
});
