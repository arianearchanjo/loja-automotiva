import { Navigate, Outlet } from "react-router-dom";
import { authClient } from "../lib/auth-client";

export function ProtectedRoute() {
  const { data, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted">Carregando...</p>
      </div>
    );
  }

  if (!data) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}