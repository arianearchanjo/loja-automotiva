import { createAuthClient } from "better-auth/react";

// Sem VITE_API_URL o cliente usa a mesma origem (localhost:5173 em dev; o
// domínio do front em produção, onde o Vercel faz proxy de /api para o backend).
export const authClient = createAuthClient(
  import.meta.env.VITE_API_URL ? { baseURL: import.meta.env.VITE_API_URL } : {},
);