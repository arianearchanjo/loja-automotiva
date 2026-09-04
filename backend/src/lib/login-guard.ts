import type { NextFunction, Request, Response } from "express";

export const MAX_FAILED_ATTEMPTS = 3;
export const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos

interface AttemptRecord {
  count: number;
  blockedUntil: number | null;
}

const attempts = new Map<string, AttemptRecord>();

export function isBlocked(email: string): boolean {
  const record = attempts.get(email);
  if (!record) return false;
  if (record.blockedUntil === null) return false;
  if (Date.now() >= record.blockedUntil) {
    attempts.delete(email);
    return false;
  }
  return true;
}

export function registerFailure(email: string): void {
  const record = attempts.get(email) ?? { count: 0, blockedUntil: null };
  record.count += 1;
  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.blockedUntil = Date.now() + BLOCK_DURATION_MS;
    record.count = 0;
  }
  attempts.set(email, record);
}

export function registerSuccess(email: string): void {
  attempts.delete(email);
}

export function remainingBlockMs(email: string): number {
  const record = attempts.get(email);
  if (!record?.blockedUntil) return 0;
  const remaining = record.blockedUntil - Date.now();
  return remaining > 0 ? remaining : 0;
}

/**
 * Middleware de proteção de login (RN02): bloqueia temporariamente o e-mail
 * após MAX_FAILED_ATTEMPTS tentativas inválidas e impede novas tentativas
 * durante BLOCK_DURATION_MS.
 */
export function loginGuard(req: Request, res: Response, next: NextFunction): void {
  if (req.path.includes("/sign-in") && req.method === "POST") {
    const email = (req.body?.email ?? "").toString().toLowerCase();
    if (!email) {
      next();
      return;
    }
    if (isBlocked(email)) {
      res.status(429).json({
        message: `Muitas tentativas. Tente novamente em ${Math.ceil(remainingBlockMs(email) / 60000)} minuto(s).`,
        code: "TOO_MANY_ATTEMPTS",
        retryAfterMs: remainingBlockMs(email),
      });
      return;
    }
  }
  next();
}