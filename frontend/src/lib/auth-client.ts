import { createAuthClient } from "better-auth/react";

// Em desenvolvimento, VITE_API_URL pode apontar para o backend local.
// Em produção, usa a mesma origem: o Vercel proxy encaminha /api para o backend.
const isDev = import.meta.env.DEV;
const viteApiUrl = import.meta.env.VITE_API_URL;

export const authClient = createAuthClient(
  isDev && viteApiUrl ? { baseURL: viteApiUrl } : {},
);