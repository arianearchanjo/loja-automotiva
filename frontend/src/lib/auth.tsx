import { type ReactNode, createContext, useContext } from "react";
import { authClient } from "./auth-client";

interface SessionData {
  user?: {
    id: string;
    name?: string;
    email?: string;
  } | null;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toUser(sessionUser: { id: string; name?: string; email?: string } | null | undefined): User | null {
  if (!sessionUser) return null;
  return {
    id: sessionUser.id,
    name: sessionUser.name ?? "",
    email: sessionUser.email ?? "",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = authClient.useSession() as { data: SessionData | null; isPending: boolean };

  const user = toUser(session.data?.user ?? null);

  return (
    <AuthContext.Provider value={{ user, loading: session.isPending }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}