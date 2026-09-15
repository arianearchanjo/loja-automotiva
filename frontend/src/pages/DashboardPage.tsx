import { useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";

export function DashboardPage() {
  const navigate = useNavigate();
  const { data } = authClient.useSession();

  async function handleLogout() {
    await authClient.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="flex items-center justify-between bg-white px-6 py-4 shadow-sm">
        <h1 className="text-lg font-bold text-slate-800">Loja Automotiva</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">
            Olá, {data?.user?.name}
          </span>
          <button
            onClick={handleLogout}
            className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="rounded-lg bg-white p-8 text-center shadow-md">
          <h2 className="text-xl font-semibold text-slate-800">
            Dashboard em construção
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Esta é a tela inicial após o login (RF02).
          </p>
        </div>
      </main>
    </div>
  );
}