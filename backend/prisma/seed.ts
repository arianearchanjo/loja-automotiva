import { auth } from "../src/lib/auth.js";
import { prisma } from "../src/lib/prisma.js";
import { env } from "../src/env.js";

async function main(): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { email: env.SEED_ADMIN_EMAIL },
  });

  if (existing) {
    console.log(`[seed] usuário ${env.SEED_ADMIN_EMAIL} já existe — nada a fazer.`);
    return;
  }

  const { user, error } = await auth.api.signUpEmail({
    body: {
      email: env.SEED_ADMIN_EMAIL,
      password: env.SEED_ADMIN_PASSWORD,
      name: env.SEED_ADMIN_NAME,
    },
  });

  if (error || !user) {
    throw new Error(`[seed] falha ao criar usuário: ${error?.message ?? "erro desconhecido"}`);
  }

  console.log(`[seed] usuário ${user.email} criado com sucesso.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
