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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-accent/15 blur-[120px]" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md animate-fade-up">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-accent shadow-glow">
            <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-white">
              <path
                d="M4 11.5h16l-1.5 3a2 2 0 0 1-1.7 1H7.2a2 2 0 0 1-1.7-1l-1.5-3Z"
                fill="currentColor"
                opacity="0.95"
              />
              <path
                d="M3 11.5 5 6.5a2 2 0 0 1 1.8-1.2h10.4A2 2 0 0 1 19 6.5l2 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle cx="8" cy="17.5" r="1.6" fill="currentColor" />
              <circle cx="16" cy="17.5" r="1.6" fill="currentColor" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Loja Automotiva</h1>
          <p className="mt-2 max-w-xs text-sm text-muted">
            Gestão comercial e financeira — acompanhe custos, vendas e lucros em um só lugar.
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-surface/80 p-8 shadow-card backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white">Entrar</h2>
          <p className="mt-1 text-sm text-muted">Acesse sua conta para continuar.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
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
                autoComplete="email"
                placeholder="voce@loja.com"
                className="w-full rounded-xl border border-border bg-surface-strong/70 px-3.5 py-2.5 text-sm text-white placeholder:text-muted/60 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                className="w-full rounded-xl border border-border bg-surface-strong/70 px-3.5 py-2.5 text-sm text-white placeholder:text-muted/60 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-primary to-primary-strong px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:-translate-y-px hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>

            <p className="pt-1 text-center text-xs text-muted">
              Acesso inicial: admin@loja.com
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}