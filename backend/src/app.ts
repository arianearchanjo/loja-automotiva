import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { env } from "./env.js";
import { auth } from "./lib/auth.js";
import {
  registerFailure,
  registerSuccess,
  loginGuard,
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
app.all(
  "/api/auth/*",
  loginGuard,
  (req: Request, res: Response) => {
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
  },
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", env: env.NODE_ENV });
});

app.get("/", (_req, res) => {
  res.json({ name: "Loja Automotiva API", version: "1.0.0" });
});
