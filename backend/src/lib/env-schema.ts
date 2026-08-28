import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(16, "BETTER_AUTH_SECRET deve ter ao menos 16 caracteres"),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3333"),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
});

export type Env = z.infer<typeof envSchema>;
