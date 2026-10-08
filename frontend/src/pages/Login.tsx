import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card } from "../components/ui";
import { authClient } from "../lib/auth-client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
      });

      if (signInError) {
        if (signInError.status === 429) {
          throw new Error("Muitas tentativas. Tente novamente em alguns minutos.");
        }
        throw new Error(signInError.message || "E-mail ou senha inválidos.");
      }

      setRedirecting(true);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      {redirecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-xl bg-surface-strong px-8 py-6 shadow-card">
            <svg className="h-5 w-5 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.224V12a6 6 0 006 6z"
              />
            </svg>
            <span className="text-sm font-medium text-primary">Redirecionando…</span>
          </div>
        </div>
      )}
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-10 flex flex-col items-center text-center">
          <img src="/logo.png" alt="Fagom Shop" className="h-20 w-20 mx-auto" />
          <h1 className="mt-4 text-2xl font-bold text-primary">Fagom Shop</h1>
          <p className="mt-1 text-sm text-muted">Gestão Comercial</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger animate-fade-in">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-muted">E-mail</label>
              <input
                type="email"
                required
                autoFocus
                autoComplete="email"
                placeholder="voce@loja.com"
                className="w-full rounded-xl border border-border bg-surface-strong px-4 py-3 text-sm text-primary placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-muted">Senha</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-surface-strong px-4 py-3 text-sm text-primary placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full py-3 text-base" disabled={loading}>
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.224V12a6 6 0 006 6z"
                    />
                  </svg>
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
