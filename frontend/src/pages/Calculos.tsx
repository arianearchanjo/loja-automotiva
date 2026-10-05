import { useEffect, useState } from "react";
import { calculosApi, type Calculo } from "../lib/api";
import { Badge, Button, Card, CardHeader, EmptyState, Field, PageHeader, Select, Td, Th, Stat } from "../components/ui";
import { formatBRL, formatDateTime } from "../lib/format";

const emptyForm = {
  nome: "",
  tipo: "direto" as "direto" | "reverso",
  precoVenda: "",
  custoCompra: "",
  frete: "",
  taxaPlataforma: "",
  metaVendas: "",
  vendasAcumuladas: "",
  descontoPercentual: "",
  margemDesejada: "",
  resultado: "",
};

const tipoLabels: Record<"direto" | "reverso", { label: string; hint: string; icon: React.ReactNode }> = {
  direto: {
    label: "Direto (Preço de Venda → Margem)",
    hint: "Você sabe o preço de venda e quer descobrir a margem",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
      </svg>
    ),
  },
  reverso: {
    label: "Reverso (Margem → Preço de Venda)",
    hint: "Você quer uma margem e precisa saber o preço máximo de compra",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path d="M12 19V5M5 12h14" strokeLinecap="round" />
      </svg>
    ),
  },
};

function IconCalculator() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h.01M13 12h.01M9 16h.01M13 16h.01" strokeLinecap="round" />
    </svg>
  );
}

export default function Calculos() {
  const [calculos, setCalculos] = useState<Calculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [showResult, setShowResult] = useState(false);

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

  const calcularTaxaEfetiva = (current: typeof emptyForm) => {
    const taxaPlataforma = Number(current.taxaPlataforma) || 0;
    const metaVendas = Number(current.metaVendas) || 0;
    const vendasAcumuladas = Number(current.vendasAcumuladas) || 0;
    const descontoPercentual = current.descontoPercentual === "" ? 0 : Number(current.descontoPercentual) || 0;

    const aplicaDesconto = metaVendas > 0 && vendasAcumuladas >= metaVendas;
    if (!aplicaDesconto) {
      return taxaPlataforma;
    }

    const taxaEfetiva = taxaPlataforma * (1 - descontoPercentual / 100);
    return taxaEfetiva < 0 ? 0 : taxaEfetiva;
  };

  const calculateResult = (current: typeof emptyForm) => {
    const pv = Number(current.precoVenda) || 0;
    const cc = Number(current.custoCompra) || 0;
    const frete = Number(current.frete) || 0;
    const taxaEf = calcularTaxaEfetiva(current);
    const margem = Number(current.margemDesejada) || 0;

    if (current.tipo === "direto" && pv > 0) {
      return String((pv - cc - frete - taxaEf - margem).toFixed(2));
    }

    if (current.tipo === "reverso" && pv > 0 && margem > 0) {
      return String((pv - frete - taxaEf - margem).toFixed(2));
    }

    return null;
  };

  const handleInputChange = (field: string, value: string) => {
    const next = { ...form, [field]: value };
    const resultado = calculateResult(next);
    setForm({ ...next, resultado: resultado ?? "" });
    setShowResult(resultado !== null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await calculosApi.create({
        nome: form.nome,
        tipo: form.tipo,
        precoVenda: form.precoVenda ? Number(form.precoVenda) : undefined,
        custoCompra: form.custoCompra ? Number(form.custoCompra) : undefined,
        frete: form.frete ? Number(form.frete) : undefined,
        taxaPlataforma: form.taxaPlataforma ? Number(form.taxaPlataforma) : undefined,
        metaVendas: form.metaVendas ? Number(form.metaVendas) : undefined,
        vendasAcumuladas: form.vendasAcumuladas ? Number(form.vendasAcumuladas) : undefined,
        descontoPercentual: form.descontoPercentual ? Number(form.descontoPercentual) : undefined,
        margemDesejada: form.margemDesejada ? Number(form.margemDesejada) : undefined,
        resultado: form.resultado ? Number(form.resultado) : undefined,
      });
      setForm(emptyForm);
      setShowResult(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
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

  const currentTipo = tipoLabels[form.tipo];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Cálculos de Preço"
        subtitle="Calcule o preço de venda (direto) ou descubra o quanto pode gastar (reverso)."
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
            <div className="p-3 rounded-xl bg-surface-strong/50 border border-border/50">
              <div className="flex items-center gap-2 text-sm font-medium text-muted mb-2">
                {currentTipo.icon}
                <span>{currentTipo.label}</span>
              </div>
              <p className="text-xs text-muted/80">{currentTipo.hint}</p>
            </div>

            <Field
              label="Nome do produto/serviço"
              required
              placeholder="Ex.: Kit freio dianteiro"
              value={form.nome}
              onChange={(e) => handleInputChange("nome", e.target.value)}
            />

            <Select
              label="Tipo de cálculo"
              value={form.tipo}
              onChange={(e) => handleInputChange("tipo", e.target.value)}
            >
              <option value="direto">Direto — Preço de Venda → Margem</option>
              <option value="reverso">Reverso — Margem → Preço máximo</option>
            </Select>

            <div className="space-y-4">
              {form.tipo === "direto" ? (
                <>
                  <Field
                    label="Preço de venda (R$)"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0,00"
                    value={form.precoVenda}
                    onChange={(e) => handleInputChange("precoVenda", e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="Custo de compra (R$)"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={form.custoCompra}
                      onChange={(e) => handleInputChange("custoCompra", e.target.value)}
                    />
                    <Field
                      label="Frete (R$)"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={form.frete}
                      onChange={(e) => handleInputChange("frete", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="Taxa plataforma (R$)"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={form.taxaPlataforma}
                      onChange={(e) => handleInputChange("taxaPlataforma", e.target.value)}
                    />
                    <Field
                      label="Margem desejada (R$)"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={form.margemDesejada}
                      onChange={(e) => handleInputChange("margemDesejada", e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <Field
                    label="Preço de venda alvo (R$)"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0,00"
                    value={form.precoVenda}
                    onChange={(e) => handleInputChange("precoVenda", e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="Frete (R$)"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={form.frete}
                      onChange={(e) => handleInputChange("frete", e.target.value)}
                    />
                    <Field
                      label="Taxa plataforma (R$)"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={form.taxaPlataforma}
                      onChange={(e) => handleInputChange("taxaPlataforma", e.target.value)}
                    />
                  </div>
                  <Field
                    label="Margem desejada (R$)"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0,00"
                    value={form.margemDesejada}
                    onChange={(e) => handleInputChange("margemDesejada", e.target.value)}
                  />
                </>
              )}
            </div>

            {showResult && form.resultado && (
              <div className="space-y-3">
                <div className="rounded-xl border border-success/30 bg-success/10 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-success">Resultado</p>
                      <p className="mt-1 text-2xl font-bold tabular-nums text-white">{formatBRL(form.resultado)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted">Margem</p>
                      <p className="font-semibold text-success">{formatBRL(form.margemDesejada)}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-border/50 bg-surface-strong/50 p-3 text-xs space-y-2">
                  {(() => {
                    const taxaOriginal = Number(form.taxaPlataforma) || 0;
                    const metaVendas = Number(form.metaVendas) || 0;
                    const vendasAcumuladas = Number(form.vendasAcumuladas) || 0;
                    const descontoPercentual = form.descontoPercentual === "" ? 0 : Number(form.descontoPercentual) || 0;
                    const aplicaDesconto = metaVendas > 0 && vendasAcumuladas >= metaVendas;
                    const taxaEfetiva = calcularTaxaEfetiva(form);
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-muted">Taxa original</span>
                          <span className="tabular-nums text-white">{formatBRL(taxaOriginal.toFixed(2))}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted">Desconto aplicado</span>
                          <span className="tabular-nums text-white">
                            {aplicaDesconto ? `${descontoPercentual.toFixed(2)}%` : "meta não atingida"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-t border-border/50 pt-2">
                          <span className="text-muted">Taxa efetiva (usada no cálculo)</span>
                          <span className="tabular-nums font-semibold text-white">{formatBRL(taxaEfetiva.toFixed(2))}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field
                label="Meta de vendas (R$)"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={form.metaVendas}
                onChange={(e) => handleInputChange("metaVendas", e.target.value)}
              />
              <Field
                label="Vendas acumuladas (R$)"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={form.vendasAcumuladas}
                onChange={(e) => handleInputChange("vendasAcumuladas", e.target.value)}
              />
              <Field
                label="Desconto na taxa (%)"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="0,00"
                value={form.descontoPercentual}
                onChange={(e) => handleInputChange("descontoPercentual", e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full py-3" disabled={!form.nome || !form.precoVenda}>
              Salvar cálculo
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
                    <Th>Tipo</Th>
                    <Th>Venda</Th>
                    <Th>Custo</Th>
                    <Th>Resultado</Th>
                    <Th>Margem</Th>
                    <Th>Criado em</Th>
                    <Th className="text-right w-24">Ações</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {calculos.map((c) => (
                    <tr key={c.id} className="transition-colors hover:bg-black/5">
                      <Td className="max-w-[250px] truncate font-semibold text-white">{c.nome}</Td>
                      <Td>
                        <Badge tone={c.tipo === "direto" ? "accent" : "primary"}>{c.tipo}</Badge>
                      </Td>
                      <Td className="tabular-nums text-muted">{formatBRL(c.precoVenda)}</Td>
                      <Td className="tabular-nums text-muted">{formatBRL(c.custoCompra)}</Td>
                      <Td className="tabular-nums font-semibold text-white">{formatBRL(c.resultado)}</Td>
                      <Td className="tabular-nums font-medium text-primary">{formatBRL(c.margemDesejada)}</Td>
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