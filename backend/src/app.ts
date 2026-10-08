import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { env } from "./env.js";
import { auth } from "./lib/auth.js";
import { prisma } from "./lib/prisma.js";
import { calculosRouter } from "./routes/calculos.js";
import { simulacaoRouter } from "./routes/simulacao.js";
import { vendasRouter } from "./routes/vendas.js";
import { analisesRouter } from "./routes/analises.js";
import {
  registerFailure,
  registerSuccess,
} from "./lib/login-guard.js";

export const app: Express = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());

// Better Auth expõe suas rotas em /api/auth
app.get("/api/auth/setup-status", async (_req: Request, res: Response) => {
  try {
    const contaCriada = (await prisma.usuario.count({ take: 1 })) > 0;
    res.json({ contaCriada });
  } catch (error) {
    console.error("[setup-status] erro de banco:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.all(
  "/api/auth/*",
  async (req: Request, res: Response) => {
    const criandoConta = req.method === "POST" && req.path.includes("/sign-up");

    if (criandoConta) {
      const contaJaCriada = (await prisma.usuario.count({ take: 1 })) > 0;
      if (contaJaCriada) {
        res.status(403).json({
          error: "A conta de acesso já foi criada. A criação é permitida apenas uma vez.",
        });
        return;
      }
    }

    try {
      const handler = toNodeHandler(auth);

      res.on("finish", () => {
        if (req.path.includes("/sign-in") && req.method === "POST") {
          const email = (req.body?.email ?? "").toString().toLowerCase();
          if (!email) return;
          if (res.statusCode < 200 || res.statusCode >= 300) {
            registerFailure(email);
          } else {
            registerSuccess(email);
          }
        }
      });

      return handler(req, res);
    } catch (error) {
      console.error("[auth] erro no handler:", error);
      res.status(500).json({ message: "Erro interno no processamento de autenticação." });
    }
  },
);

app.use("/api/calculos", calculosRouter);
app.use("/api/simulacoes", simulacaoRouter);
app.use("/api/vendas", vendasRouter);
app.use("/api/analises", analisesRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", env: env.NODE_ENV });
});

app.get("/", (_req, res) => {
  res.json({ name: "Loja Automotiva API", version: "1.0.0" });
});
