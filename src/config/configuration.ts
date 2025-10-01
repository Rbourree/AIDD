export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRATION || '7d',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET,
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRATION || '30d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN,
  },
  mailjet: {
    apiKey: process.env.MAILJET_API_KEY,
    secretKey: process.env.MAILJET_SECRET_KEY,
    senderEmail: process.env.MAILJET_SENDER_EMAIL,
    senderName: process.env.MAILJET_SENDER_NAME,
  },
  invitation: {
    baseUrl: process.env.INVITATION_BASE_URL,
    expiresIn: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  },
  sentry: {
    dsn: process.env.SENTRY_DSN,
    release: process.env.SENTRY_RELEASE || `nestjs-api@${process.env.npm_package_version || '1.0.0'}`,
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || (process.env.NODE_ENV === 'production' ? 0.1 : 1.0),
    profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE) || 0.0,
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
    limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100,
  },
  yousign: {
    apiKey: process.env.YOUSIGN_API_KEY,
    environment: process.env.YOUSIGN_ENVIRONMENT || 'sandbox',
  },
  ar24: {
    token: process.env.AR24_TOKEN,
    privateKey: process.env.AR24_PRIVATE_KEY,
    environment: process.env.AR24_ENVIRONMENT || 'sandbox',
  },
});
