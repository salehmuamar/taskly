import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

let _config: z.infer<typeof envSchema> | null = null;

function validateEnv(): z.infer<typeof envSchema> {
  if (_config) return _config;

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const message = Object.entries(errors)
      .map(([key, msgs]) => `${key}: ${msgs?.join(', ')}`)
      .join('\n');

    if (process.env.NODE_ENV === 'development') {
      console.error('Invalid environment variables:', message);
    }
    throw new Error(`Invalid environment variables:\n${message}`);
  }

  _config = parsed.data;
  return _config;
}

export const config = validateEnv();
