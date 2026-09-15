import express, { type Express } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { env } from "./env.js";
import { auth } from "./lib/auth.js";
import { calculosRouter } from "./routes/calculos.js";
import { vendasRouter } from "./routes/vendas.js";
import { analisesRouter } from "./routes/analises.js";

export const app: Express = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());

app.all("/api/auth/*", toNodeHandler(auth));

app.use("/api/calculos", calculosRouter);
app.use("/api/vendas", vendasRouter);
app.use("/api/analises", analisesRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", env: env.NODE_ENV });
});

app.get("/", (_req, res) => {
  res.json({ name: "Loja Automotiva API", version: "1.0.0" });
});
