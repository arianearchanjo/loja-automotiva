import { useEffect, useState } from "react";
import { vendasApi, type Venda } from "../lib/api";
import { Button, Card, CardHeader, EmptyState, Field, PageHeader, Td, Th } from "../components/ui";
import { formatBRL, formatDate, formatDateTime } from "../lib/format";

const emptyForm = {
  receita: "",
  custoTotal: "",
  dataVenda: new Date().toISOString().slice(0, 10),
};

export default function Vendas() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try {
      const data = await vendasApi.list();
      setVendas(data);
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
      await vendasApi.create({
        receita: Number(form.receita),
        custoTotal: Number(form.custoTotal),
        dataVenda: new Date(form.dataVenda).toISOString(),
      });
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta venda?")) return;
    try {
      await vendasApi.delete(id);
      setVendas((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir");
    }
  };

  const totalReceita = vendas.reduce((acc, v) => acc + Number(v.receita), 0);
  const totalCusto = vendas.reduce((acc, v) => acc + Number(v.custoTotal), 0);
  const totalLucro = vendas.reduce((acc, v) => acc + Number(v.lucroBruto), 0);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Vendas"
        subtitle="Registre receita e custo da venda; o lucro bruto é calculado automaticamente."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="h-fit xl:col-span-1">
          <CardHeader title="Nova venda" subtitle="Preencha os dados e salve" />
          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            {error && (
              <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            <Field
              label="Data da venda"
              type="date"
              required
              value={form.dataVenda}
              onChange={(e) => setForm({ ...form, dataVenda: e.target.value })}
            />
            <Field
              label="Receita (R$)"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0,00"
              value={form.receita}
              onChange={(e) => setForm({ ...form, receita: e.target.value })}
            />
            <Field
              label="Custo total (R$)"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0,00"
              hint="Custo relacionado à venda (compra + frete + taxas)"
              value={form.custoTotal}
              onChange={(e) => setForm({ ...form, custoTotal: e.target.value })}
            />
            <div className="rounded-xl border border-border/60 bg-surface-strong/40 px-4 py-3 text-sm">
              <span className="text-muted">Lucro bruto previsto: </span>
              <span className="font-semibold tabular-nums text-white">
                {form.receita || form.custoTotal
                  ? formatBRL(Number(form.receita || 0) - Number(form.custoTotal || 0))
                  : "—"}
              </span>
            </div>
            <Button type="submit" className="w-full">
              Salvar venda
            </Button>
          </form>
        </Card>

        <div className="xl:col-span-2">
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Receita</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-white">{formatBRL(totalReceita)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Custo total</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-warning">{formatBRL(totalCusto)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Lucro bruto</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-success">{formatBRL(totalLucro)}</p>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <CardHeader title="Histórico de vendas" subtitle={`${vendas.length} venda(s) registrada(s)`} />
            <div className="mt-4 overflow-x-auto">
              {loading ? (
                <p className="px-5 py-10 text-center text-muted">Carregando...</p>
              ) : vendas.length === 0 ? (
                <EmptyState title="Nenhuma venda ainda" hint="Registre sua primeira venda ao lado." />
              ) : (
                <table className="w-full text-left">
                  <thead className="sr-only lg:not-sr-only">
                    <tr>
                      <Th>Data</Th>
                      <Th>Receita</Th>
                      <Th>Custo</Th>
                      <Th>Lucro bruto</Th>
                      <Th>Criado em</Th>
                      <Th className="sr-only">Ações</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {vendas.map((v) => (
                      <tr key={v.id} className="transition-colors hover:bg-white/[0.02]">
                        <Td className="font-semibold text-white">{formatDate(v.dataVenda)}</Td>
                        <Td className="tabular-nums text-muted">{formatBRL(v.receita)}</Td>
                        <Td className="tabular-nums text-muted">{formatBRL(v.custoTotal)}</Td>
                        <Td className={`tabular-nums font-semibold ${Number(v.lucroBruto) >= 0 ? "text-success" : "text-danger"}`}>
                          {formatBRL(v.lucroBruto)}
                        </Td>
                        <Td className="text-muted">{formatDateTime(v.criadoEm)}</Td>
                        <Td className="text-right">
                          <Button variant="danger" onClick={() => handleDelete(v.id)}>
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
    </div>
  );
}