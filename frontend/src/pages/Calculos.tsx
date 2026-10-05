import { useEffect, useMemo, useState } from "react";
import { calculosApi, type Calculo } from "../lib/api";
import { Button, Card, CardHeader, EmptyState, Field, PageHeader, Td, Th, Stat } from "../components/ui";
import { formatBRL, formatDateTime, formatPercent } from "../lib/format";
import {
  calcularDescontoTaxa,
  calcularPrecoVenda,
  calcularTaxaEfetiva,
  type ResultadoCalculoPreco,
} from "../lib/calculo-preco";

const emptyForm = {
  nome: "",
  custoCompra: "",
  frete: "",
  taxaPlataforma: "",
  imposto: "",
  margemDesejada: "",
  metaVendas: "",
  vendasAcumuladas: "",
  descontoPercentual: "",
};

type CalculoForm = typeof emptyForm;

const campoDecimal = {
  type: "text",
  inputMode: "decimal",
  placeholder: "0,00",
} as const;

const TIPO_CALCULO = "direto" as const;

function toNumber(value: string): number {
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function IconCalculator() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h.01M13 12h.01M9 16h.01M13 16h.01" strokeLinecap="round" />
    </svg>
  );
}

function ResultadoDetalhado({ resultado }: { resultado: ResultadoCalculoPreco }) {
  return (
    <div className="rounded-xl border border-border/50 bg-surface-strong/50 p-3 space-y-2">
      {resultado.detalhamento.map((linha, index) => {
        const ultima = index === resultado.detalhamento.length - 1;
        return (
          <div
            key={linha.rotulo}
            className={`flex items-center justify-between ${ultima ? "border-t border-border/50 pt-2" : ""}`}
          >
            <span className={ultima ? "text-sm font-semibold text-primary" : "text-muted"}>{linha.rotulo}</span>
            <span
              className={`tabular-nums ${ultima ? "font-bold text-success" : "text-white"}`}
            >
              {formatBRL(linha.valor)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function Calculos() {
  const [calculos, setCalculos] = useState<Calculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CalculoForm>(emptyForm);

  const load = async () => {
    try {
      const data = await calculosApi.list();
      setCalculos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleInputChange = (field: keyof CalculoForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const taxa = toNumber(form.taxaPlataforma);
  const imposto = toNumber(form.imposto);
  const margem = toNumber(form.margemDesejada);
  const custo = toNumber(form.custoCompra);
  const frete = toNumber(form.frete);

  const desconto = useMemo(
    () =>
      calcularDescontoTaxa(
        toNumber(form.metaVendas),
        toNumber(form.vendasAcumuladas),
        toNumber(form.descontoPercentual),
      ),
    [form.metaVendas, form.vendasAcumuladas, form.descontoPercentual],
  );

  const taxaEfetiva = useMemo(() => calcularTaxaEfetiva(taxa, desconto), [taxa, desconto]);

  const resultado = useMemo(
    () =>
      calcularPrecoVenda({
        custo,
        frete,
        taxa: taxaEfetiva,
        imposto,
        margem,
      }),
    [custo, frete, taxaEfetiva, imposto, margem],
  );

  const somaPercentuais = taxaEfetiva + imposto + margem;
  const somaInvalida = somaPercentuais >= 100;
  const semBase = custo + frete <= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!resultado) return;

    setSaving(true);
    try {
      await calculosApi.create({
        nome: form.nome,
        tipo: TIPO_CALCULO,
        precoVenda: resultado.precoVenda,
        custoCompra: custo,
        frete,
        taxaPlataforma: taxaEfetiva,
        imposto,
        margemDesejada: margem,
        metaVendas: form.metaVendas ? toNumber(form.metaVendas) : undefined,
        vendasAcumuladas: form.vendasAcumuladas ? toNumber(form.vendasAcumuladas) : undefined,
        descontoPercentual: form.descontoPercentual ? toNumber(form.descontoPercentual) : undefined,
        resultado: resultado.precoVenda,
      });
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este cálculo?")) return;
    try {
      await calculosApi.delete(id);
      setCalculos((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir");
    }
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Cálculos de Preço"
        subtitle="Informe custo, frete e percentuais e descubra o preço de venda que sobrar exatamente a margem desejada."
        action={<Stat label="Total" value={String(calculos.length)} icon={<IconCalculator />} />}
      />

      {error && (
        <div className="mb-6 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger animate-fade-in">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1 h-fit sticky top-24">
          <CardHeader title="Novo cálculo" subtitle="Preencha os dados e veja o resultado em tempo real" />
          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            <Field
              label="Nome do produto/serviço"
              required
              placeholder="Ex.: Kit freio dianteiro"
              value={form.nome}
              onChange={(e) => handleInputChange("nome", e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Custo de compra (R$)"
                required
                {...campoDecimal}
                value={form.custoCompra}
                onChange={(e) => handleInputChange("custoCompra", e.target.value)}
              />
              <Field
                label="Frete (R$)"
                {...campoDecimal}
                value={form.frete}
                onChange={(e) => handleInputChange("frete", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Taxa da plataforma (%)"
                {...campoDecimal}
                value={form.taxaPlataforma}
                onChange={(e) => handleInputChange("taxaPlataforma", e.target.value)}
              />
              <Field
                label="Imposto (%)"
                {...campoDecimal}
                value={form.imposto}
                onChange={(e) => handleInputChange("imposto", e.target.value)}
              />
            </div>

            <Field
              label="Margem de lucro desejada (%)"
              required
              {...campoDecimal}
              value={form.margemDesejada}
              onChange={(e) => handleInputChange("margemDesejada", e.target.value)}
            />

            <div className="rounded-xl border border-border/50 bg-surface-strong/40 p-4 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Desconto de taxa por meta de vendas
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Meta de vendas (R$)"
                  {...campoDecimal}
                  value={form.metaVendas}
                  onChange={(e) => handleInputChange("metaVendas", e.target.value)}
                />
                <Field
                  label="Vendas acumuladas (R$)"
                  {...campoDecimal}
                  value={form.vendasAcumuladas}
                  onChange={(e) => handleInputChange("vendasAcumuladas", e.target.value)}
                />
              </div>
              <Field
                label="Desconto na taxa (%)"
                {...campoDecimal}
                value={form.descontoPercentual}
                onChange={(e) => handleInputChange("descontoPercentual", e.target.value)}
              />
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Taxa original</span>
                  <span className="tabular-nums text-white">{formatPercent(taxa)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Desconto aplicado</span>
                  <span className="tabular-nums text-white">
                    {desconto.aplica ? formatPercent(desconto.percentual) : "meta não atingida"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-border/50 pt-2">
                  <span className="text-muted">Taxa efetiva (usada no cálculo)</span>
                  <span className="tabular-nums font-semibold text-white">{formatPercent(taxaEfetiva)}</span>
                </div>
              </div>
            </div>

            {somaInvalida ? (
              <div className="rounded-xl border border-danger/30 bg-danger/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-danger">
                  Cálculo impossível
                </p>
                <p className="mt-1 text-sm text-danger">
                  Taxa, imposto e margem somam {formatPercent(somaPercentuais)}. A soma precisa ser menor que
                  100% para existir um preço de venda.
                </p>
              </div>
            ) : resultado ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-success/30 bg-success/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-success">
                        Preço de venda
                      </p>
                      <p className="mt-1 text-2xl font-bold tabular-nums text-white">
                        {formatBRL(resultado.precoVenda)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted">Lucro</p>
                      <p className="font-semibold tabular-nums text-success">
                        {formatBRL(resultado.margemValor)}
                      </p>
                      <p className="text-xs text-muted">{formatPercent(resultado.margem)} do venda</p>
                    </div>
                  </div>
                </div>
                <ResultadoDetalhado resultado={resultado} />
                <p className="text-xs text-muted">
                  V = (custo + frete) ÷ (1 − taxa {formatPercent(resultado.taxa)} − imposto{" "}
                  {formatPercent(resultado.imposto)} − margem {formatPercent(resultado.margem)})
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 bg-surface-strong/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Fórmula</p>
                <p className="mt-1 text-sm text-white">V = (C + F) ÷ (1 − T − I − M)</p>
                <p className="mt-2 text-xs text-muted">
                  Informe o custo de compra e a margem desejada para calcular o preço de venda.
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full py-3"
              disabled={!form.nome || !resultado || somaInvalida || semBase || saving}
            >
              {saving ? "Salvando..." : "Salvar cálculo"}
            </Button>
          </form>
        </Card>

        <Card className="overflow-hidden xl:col-span-2">
          <CardHeader title="Histórico de cálculos" subtitle={`${calculos.length} cálculo(s) salvo(s)`} />
          <div className="mt-4 overflow-x-auto">
            {loading ? (
              <div className="px-5 py-10 text-center">
                <div className="inline-flex items-center gap-2 text-muted">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                  </svg>
                  Carregando...
                </div>
              </div>
            ) : calculos.length === 0 ? (
              <EmptyState title="Nenhum cálculo ainda" hint="Crie seu primeiro cálculo ao lado." />
            ) : (
              <table className="w-full text-left">
                <thead className="sr-only md:not-sr-only">
                  <tr>
                    <Th>Nome</Th>
                    <Th>Custo</Th>
                    <Th>Frete</Th>
                    <Th>Taxa</Th>
                    <Th>Imposto</Th>
                    <Th>Margem</Th>
                    <Th>Preço de venda</Th>
                    <Th>Criado em</Th>
                    <Th className="text-right w-24">Ações</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {calculos.map((c) => (
                    <tr key={c.id} className="transition-colors hover:bg-black/5">
                      <Td className="max-w-[250px] truncate font-semibold text-white">{c.nome}</Td>
                      <Td className="tabular-nums text-muted">{formatBRL(c.custoCompra)}</Td>
                      <Td className="tabular-nums text-muted">{formatBRL(c.frete)}</Td>
                      <Td className="tabular-nums text-muted">{formatPercent(c.taxaPlataforma)}</Td>
                      <Td className="tabular-nums text-muted">{formatPercent(c.imposto)}</Td>
                      <Td className="tabular-nums font-medium text-primary">
                        {formatPercent(c.margemDesejada)}
                      </Td>
                      <Td className="tabular-nums font-bold text-success">
                        {formatBRL(c.precoVenda ?? c.resultado)}
                      </Td>
                      <Td className="text-muted">{formatDateTime(c.criadoEm)}</Td>
                      <Td className="text-right">
                        <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => handleDelete(c.id)}>
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
