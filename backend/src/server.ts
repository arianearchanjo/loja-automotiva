import { app } from "./app.js";
import { env } from "./env.js";
import { prisma } from "./lib/prisma.js";

app.listen(env.PORT, () => {
  console.log(`[server] ouvindo em http://localhost:${env.PORT}`);
  console.log(`[server] ambiente: ${env.NODE_ENV}`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`\n[server] ${signal} recebido — encerrando...`);
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
