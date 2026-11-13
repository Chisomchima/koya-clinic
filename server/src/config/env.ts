import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_DB: z.string().min(1).default('koya_booking'),
  API_KEY: z.string().min(8, 'API_KEY must be at least 8 characters'),
  /**
   * How many reverse proxies sit in front of the app (Render, Heroku, ...: 1).
   * Express then takes the client IP from the right hop of X-Forwarded-For, so a client
   * can't fake its IP (and dodge the per-IP rate limit) by sending that header itself.
   */
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(1),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

export type Env = z.infer<typeof EnvSchema>;

function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`);
    throw new Error(`Invalid environment variables:\n${problems.join('\n')}`);
  }
  return parsed.data;
}

export const env = loadEnv();
