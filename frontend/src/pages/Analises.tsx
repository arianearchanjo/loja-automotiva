import { useEffect, useState } from "react";
import { analisesApi, type Analise } from "../lib/api";
import { Button, Card, CardHeader, EmptyState, Field, PageHeader, Td, Th } from "../components/ui";
import { formatBRL, formatDate, formatDateTime } from "../lib/format";

const emptyForm = {
  periodoInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10),
  periodoFim: new Date().toISOString().slice(0, 10),
};

export default function Analises() {
  const [analises, setAnalises] = useState<Analise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try {
      const data = await analisesApi.list();
      setAnalises(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await analisesApi.create({
        periodoInicio: new Date(form.periodoInicio).toISOString(),
        periodoFim: new Date(form.periodoFim).toISOString(),
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar análise");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta análise?")) return;
    try {
      await analisesApi.delete(id);
      setAnalises((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir");
    }
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Análises Financeiras"
        subtitle="Gere análises por período: o sistema resume vendas, custos e lucro automaticamente."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="h-fit xl:col-span-1">
          <CardHeader title="Nova análise" subtitle="Selecione o período" />
          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            {error && (
              <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            <Field
              label="Início do período"
              type="date"
              required
              value={form.periodoInicio}
              onChange={(e) => setForm({ ...form, periodoInicio: e.target.value })}
            />
            <Field
              label="Fim do período"
              type="date"
              required
              value={form.periodoFim}
              onChange={(e) => setForm({ ...form, periodoFim: e.target.value })}
            />
            <Button type="submit" className="w-full">
              Gerar análise
            </Button>
          </form>
        </Card>

        <Card className="overflow-hidden xl:col-span-2">
          <CardHeader title="Histórico" subtitle={`${analises.length} análise(s) gerada(s)`} />
          <div className="mt-4 overflow-x-auto">
            {loading ? (
              <p className="px-5 py-10 text-center text-muted">Carregando...</p>
            ) : analises.length === 0 ? (
              <EmptyState title="Nenhuma análise ainda" hint="Selecione um período ao lado para gerar." />
            ) : (
              <table className="w-full text-left">
                <thead className="sr-only lg:not-sr-only">
                  <tr>
                    <Th>Período</Th>
                    <Th>Receita</Th>
                    <Th>Custo</Th>
                    <Th>Lucro</Th>
                    <Th>Gerada em</Th>
                    <Th className="sr-only">Ações</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {analises.map((a) => (
                    <tr key={a.id} className="transition-colors hover:bg-white/[0.02]">
                      <Td className="font-semibold text-white">
                        {formatDate(a.periodoInicio)} — {formatDate(a.periodoFim)}
                      </Td>
                      <Td className="tabular-nums text-muted">{formatBRL(a.receitaTotal)}</Td>
                      <Td className="tabular-nums text-muted">{formatBRL(a.custoTotal)}</Td>
                      <Td className={`tabular-nums font-semibold ${Number(a.lucroTotal) >= 0 ? "text-success" : "text-danger"}`}>
                        {formatBRL(a.lucroTotal)}
                      </Td>
                      <Td className="text-muted">{formatDateTime(a.criadoEm)}</Td>
                      <Td className="text-right">
                        <Button variant="danger" onClick={() => handleDelete(a.id)}>
                          Excluir
                        </Button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}