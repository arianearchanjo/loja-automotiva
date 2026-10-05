import { useCallback, useEffect, useState } from "react";
import { vendasApi, type PaginacaoInfo, type Venda, type VendasResumo } from "../lib/api";
import { Button, Card, CardHeader, EmptyState, Field, PageHeader, Paginacao, Td, Th } from "../components/ui";
import { formatBRL, formatDate, formatDateTime } from "../lib/format";

const emptyForm = {
  receita: "",
  custoTotal: "",
  dataVenda: new Date().toISOString().slice(0, 10),
};

const PAGINA_INICIAL = 1;
const LIMITE_INICIAL = 20;

export default function Vendas() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [resumo, setResumo] = useState<VendasResumo | null>(null);
  const [pagina, setPagina] = useState(PAGINA_INICIAL);
  const [limite, setLimite] = useState(LIMITE_INICIAL);
  const [info, setInfo] = useState<PaginacaoInfo>({
    pagina: PAGINA_INICIAL,
    limite: LIMITE_INICIAL,
    total: 0,
    totalPaginas: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [paginado, resumoTotal] = await Promise.all([
        vendasApi.list({ pagina, limite }),
        vendasApi.resumo(),
      ]);
      setVendas(paginado.dados);
      setInfo(paginado.paginacao);
      setResumo(resumoTotal);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [pagina, limite]);

  useEffect(() => {
    load();
  }, [load]);

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
      // Volta para a primeira página para exibir o registro recém-criado.
      setPagina(PAGINA_INICIAL);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta venda?")) return;
    try {
      await vendasApi.delete(id);
      if (vendas.length === 1 && pagina > 1) setPagina(pagina - 1);
      else await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir");
    }
  };

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
              <p className="mt-1 text-xl font-bold tabular-nums text-white">{formatBRL(resumo?.receita ?? 0)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Custo total</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-warning">{formatBRL(resumo?.custo ?? 0)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Lucro bruto</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-success">{formatBRL(resumo?.lucro ?? 0)}</p>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <CardHeader title="Histórico de vendas" subtitle={`${info.total} venda(s) registrada(s)`} />
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
                      <tr key={v.id} className="transition-colors hover:bg-black/5">
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

            <Paginacao
              pagina={info.pagina}
              totalPaginas={info.totalPaginas}
              total={info.total}
              limite={info.limite}
              carregando={loading}
              onPagina={setPagina}
              onLimite={(novo) => {
                setLimite(novo);
                setPagina(PAGINA_INICIAL);
              }}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}