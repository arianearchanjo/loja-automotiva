import { Navigate, Outlet } from "react-router-dom";
import { authClient } from "../lib/auth-client";

export function ProtectedRoute() {
  const { data, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-500">Carregando...</p>
      </div>
    );
  }

  if (!data) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}