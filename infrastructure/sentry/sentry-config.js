module.exports = {
  system: {
    secretKey: process.env.SENTRY_SECRET_KEY,
  },

  redis: {
    cluster: null,
    host: process.env.REDIS_HOST || 'redis',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
  },

  postgres: {
    host: process.env.POSTGRES_HOST || 'postgres',
    port: process.env.POSTGRES_PORT || 5432,
    name: process.env.POSTGRES_DB || 'sentry',
    user: process.env.POSTGRES_USER || 'sentry',
    password: process.env.POSTGRES_PASSWORD || '',
  },

  mail: {
    backend: process.env.SENTRY_EMAIL_BACKEND || 'smtp',
    host: process.env.SENTRY_EMAIL_HOST || 'smtp',
    port: process.env.SENTRY_EMAIL_PORT || 25,
    username: process.env.SENTRY_EMAIL_USER || '',
    password: process.env.SENTRY_EMAIL_PASSWORD || '',
    useTls: process.env.SENTRY_EMAIL_USE_TLS === 'true',
    from: process.env.SENTRY_EMAIL_FROM || 'sentry@localhost',
  },

  symbolicator: {
    enabled: false,
  },

  eventRetention: process.env.SENTRY_EVENT_RETENTION || 90,

  kafka: {
    hosts: {
      0: [process.env.KAFKA_HOST || 'kafka:9092'],
    },
  },

  fileStore: {
    backend: process.env.SENTRY_FILESTORE_BACKEND || 'filesystem',
    filesystem: {
      path: process.env.SENTRY_FILESTORE_PATH || '/var/lib/sentry/files',
    },
  },
};
