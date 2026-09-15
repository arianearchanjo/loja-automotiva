import { type Request, type Response, type NextFunction } from "express";
import { auth } from "../lib/auth.js";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = await auth.api.getSession({
    headers: req.headers as any,
  });

  if (!session) {
    return res.status(401).json({ error: "Não autenticado" });
  }

  (req as any).user = session.user;
  next();
}
