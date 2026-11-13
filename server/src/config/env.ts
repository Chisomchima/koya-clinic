import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_DB: z.string().min(1).default('koya_booking'),
  API_KEY: z.string().min(8, 'API_KEY must be at least 8 characters'),
  // Proxies in front of the app (Render: 1). Stops clients faking their IP via X-Forwarded-For.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(1),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  const problems = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`);
  throw new Error(`Invalid environment variables:\n${problems.join('\n')}`);
}

export const env = parsed.data;
