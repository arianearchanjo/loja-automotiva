import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui";

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
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted">
            Credenciais padrão: admin@loja.com / Admin@2026!segura
          </p>
        </Card>
      </div>
    </div>
  );
}
