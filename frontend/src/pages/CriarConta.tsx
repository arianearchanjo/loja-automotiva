import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button, Card } from "../components/ui";
import { useAuth } from "../lib/auth";

const extrairMensagem = (corpo: unknown): string | null => {
  if (!corpo || typeof corpo !== "object") return null;
  const error = (corpo as { error?: unknown }).error;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const mensagem = (error as { message?: unknown }).message;
    if (typeof mensagem === "string") return mensagem;
  }
  return null;
};

export default function CriarConta() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [statusCarregando, setStatusCarregando] = useState(true);
  const [contaCriada, setContaCriada] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [criando, setCriando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    fetch("/api/auth/setup-status", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { contaCriada: true }))
      .then((dados) => setContaCriada(Boolean(dados?.contaCriada)))
      .catch(() => setContaCriada(true))
      .finally(() => setStatusCarregando(false));
  }, []);

  useEffect(() => {
    if (!sucesso) return;
    const timer = setTimeout(() => navigate("/login", { replace: true }), 2500);
    return () => clearTimeout(timer);
  }, [sucesso, navigate]);

  if (loading || statusCarregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted">Carregando...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  if (contaCriada) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    if (senha !== confirmacao) {
      setErro("As senhas não conferem.");
      return;
    }

    setCriando(true);

    try {
      const res = await fetch("/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: nome, email, password: senha }),
      });

      if (!res.ok) {
        const corpo = await res.json().catch(() => null);
        throw new Error(
          extrairMensagem(corpo) ?? "Não foi possível criar a conta. Tente novamente.",
        );
      }

      setSucesso(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao criar a conta.");
    } finally {
      setCriando(false);
    }
  };

  if (sucesso) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-md p-8 text-center animate-fade-up">
          <p className="text-lg font-semibold text-success">Conta criada com sucesso!</p>
          <p className="mt-2 text-sm text-muted">
            A criação de conta é feita apenas uma vez. Redirecionando para o acesso...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-10 flex flex-col items-center text-center">
          <img src="/logo.png" alt="Fagom Shop" className="h-20 w-20 mx-auto" />
          <h1 className="mt-4 text-2xl font-bold text-primary">Fagom Shop</h1>
          <p className="mt-1 text-sm text-muted">Criar conta de acesso</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {erro && (
              <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger animate-fade-in">
                {erro}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-muted">Nome</label>
              <input
                type="text"
                required
                autoFocus
                autoComplete="name"
                placeholder="Seu nome"
                className="w-full rounded-xl border border-border bg-surface-strong px-4 py-3 text-sm text-primary placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-colors"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-muted">E-mail</label>
              <input
                type="email"
                required
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
                minLength={4}
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-surface-strong px-4 py-3 text-sm text-primary placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-colors"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-muted">Confirmar senha</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-surface-strong px-4 py-3 text-sm text-primary placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-colors"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full py-3 text-base" disabled={criando}>
              {criando ? "Criando..." : "Criar conta"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}