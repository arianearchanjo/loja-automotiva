import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 429) {
          throw new Error("Muitas tentativas. Tente novamente em alguns minutos.");
        }
        throw new Error(data.message || "E-mail ou senha inválidos.");
      }

      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-10 flex flex-col items-center">
          <img src="/logo.png" alt="Loja Automotiva" className="h-40 w-40" />
        </div>

        <div className="rounded-3xl border border-border bg-surface p-8 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                E-mail
              </span>
              <input
                type="email"
                required
                autoFocus
                autoComplete="email"
                placeholder="voce@loja.com"
                className="w-full rounded-xl border border-border bg-surface-strong px-3.5 py-2.5 text-sm text-primary placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                Senha
              </span>
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-surface-strong px-3.5 py-2.5 text-sm text-primary placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl border border-border bg-primary px-4 py-3 text-base font-semibold text-surface transition-all hover:translate-y-px hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
