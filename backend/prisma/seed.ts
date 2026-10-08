import "dotenv/config";
import { hashPassword } from "better-auth/crypto";
import { prisma } from "../src/lib/prisma.js";

const ADMIN_NAME = "Fagom Shop Admin";
const ADMIN_EMAIL = "lucas_gomes1020@hotmail.com";
const ADMIN_PASSWORD = "Lu1fa.go";

async function main() {
  const existing = await prisma.usuario.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (existing) {
    console.log("[seed] Usuário admin já existe. Nenhuma ação necessária.");
    return;
  }

  const hashedPassword = await hashPassword(ADMIN_PASSWORD);

  const user = await prisma.usuario.create({
    data: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      emailVerified: false,
    },
  });

  await prisma.account.create({
    data: {
      userId: user.id,
      providerId: "credential",
      accountId: user.id,
      password: hashedPassword,
    },
  });

  console.log(`[seed] Usuário admin criado com sucesso: ${user.email}`);
}

main()
  .catch((e) => {
    console.error("[seed] Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
