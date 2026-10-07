import { app } from "./app.js";
import { env } from "./env.js";
import { prisma } from "./lib/prisma.js";
import { auth } from "./lib/auth.js";

async function bootstrap(): Promise<void> {
  const existing = await prisma.usuario.findUnique({
    where: { email: env.SEED_ADMIN_EMAIL },
  });

  if (existing) {
    console.log(`[bootstrap] usuário admin ${env.SEED_ADMIN_EMAIL} já existe.`);
    return;
  }

  const { user } = await auth.api.signUpEmail({
    body: {
      email: env.SEED_ADMIN_EMAIL,
      password: env.SEED_ADMIN_PASSWORD,
      name: env.SEED_ADMIN_NAME,
    },
  });

  if (!user) {
    throw new Error("[bootstrap] falha ao criar usuário admin");
  }

  console.log(`[bootstrap] usuário admin ${user.email} criado com sucesso.`);
}

async function main(): Promise<void> {
  await bootstrap();

  const server = app.listen(env.PORT, () => {
    console.log(`[server] ouvindo em http://localhost:${env.PORT}`);
    console.log(`[server] ambiente: ${env.NODE_ENV}`);
  });

  async function shutdown(signal: string): Promise<void> {
    console.log(`\n[server] ${signal} recebido — encerrando...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  }

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("[server] erro na inicialização:", err);
  process.exit(1);
});
