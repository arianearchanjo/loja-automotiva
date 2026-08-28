import "dotenv/config";
import { envSchema, type Env } from "./lib/env-schema.js";

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Variáveis de ambiente inválidas:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Falha na validação das variáveis de ambiente");
}

export const env: Env = parsed.data;
