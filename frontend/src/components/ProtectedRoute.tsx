import { Navigate, Outlet } from "react-router-dom";
import { authClient } from "../lib/auth-client";

interface SessionData {
  user?: {
    id: string;
    name?: string;
    email?: string;
  } | null;
}

export function ProtectedRoute() {
  const session = authClient.useSession() as { data: SessionData | null; isPending: boolean };

  if (session.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted">Carregando...</p>
      </div>
    );
  }

  if (!session.data?.user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}