export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  corsOrigins: string[];
  jwt: {
    accessSecret: string;
    accessExpiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  i18n: {
    defaultLanguage: string;
    supportedLanguages: string[];
  };
  throttle: {
    ttl: number;
    limit: number;
  };
  fcm: {
    projectId?: string;
    clientEmail?: string;
    privateKey?: string;
  };
  storage: {
    provider: 'local' | 's3';
    bucket: string;
    endpoint?: string;
    region: string;
    accessKey?: string;
    secretKey?: string;
    localDir: string;
    localPublicBaseUrl: string;
  };
}

export default (): { app: AppConfig } => ({
  app: {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '4000', 10),
    apiPrefix: process.env.API_PREFIX ?? 'api/v1',
    corsOrigins: (process.env.CORS_ORIGINS ?? '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    jwt: {
      accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
      accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
      refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
    },
    redis: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
    },
    i18n: {
      defaultLanguage: process.env.DEFAULT_LANGUAGE ?? 'bn',
      supportedLanguages: (process.env.SUPPORTED_LANGUAGES ?? 'bn,en')
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean),
    },
    throttle: {
      ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
      limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
    },
    fcm: {
      projectId: process.env.FCM_PROJECT_ID || undefined,
      clientEmail: process.env.FCM_CLIENT_EMAIL || undefined,
      // .env files typically escape newlines as \n — unescape them back to
      // real newlines, which the PEM private key format requires.
      privateKey: process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n') || undefined,
    },
    storage: {
      provider: (process.env.STORAGE_PROVIDER as 'local' | 's3') ?? 'local',
      bucket: process.env.STORAGE_BUCKET ?? 'gher-media',
      endpoint: process.env.STORAGE_ENDPOINT || undefined,
      region: process.env.STORAGE_REGION ?? 'auto',
      accessKey: process.env.STORAGE_ACCESS_KEY || undefined,
      secretKey: process.env.STORAGE_SECRET_KEY || undefined,
      localDir: process.env.STORAGE_LOCAL_DIR ?? './uploads',
      localPublicBaseUrl:
        process.env.STORAGE_LOCAL_PUBLIC_BASE_URL ?? 'http://localhost:4000/api/v1/media/files',
    },
  },
});
