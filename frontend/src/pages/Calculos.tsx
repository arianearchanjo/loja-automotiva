import { useEffect, useState } from "react";
import { calculosApi, type Calculo, type SimulacaoResultado } from "../lib/api";
import { Badge, Button, Card, CardHeader, EmptyState, Field, PageHeader, Select, Td, Th, Stat } from "../components/ui";
import { formatBRL, formatDateTime, formatPercent } from "../lib/format";

type TipoCalculo = "direto" | "reverso" | "vendaIdeal";

const emptyForm = {
  nome: "",
  tipo: "direto" as TipoCalculo,
  precoVenda: "",
  custoCompra: "",
  frete: "",
  taxaPlataformaPercentual: "",
  impostoPercentual: "",
  descontoPlataforma: "",
  metaVendaAlcancada: false,
  margemPercentual: "",
};

const tipoLabels: Record<TipoCalculo, { label: string; hint: string; icon: React.ReactNode }> = {
  direto: {
    label: "Direto (Preço de venda → Lucro)",
    hint: "Você informa o preço de venda e descobre o lucro e a margem",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
      </svg>
    ),
  },
  reverso: {
    label: "Reverso (Preço de venda → Custo máximo)",
    hint: "Você informa o preço de venda e descobre até quanto pode pagar no produto",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path d="M12 19V5M5 12h14" strokeLinecap="round" />
      </svg>
    ),
  },
  vendaIdeal: {
    label: "Venda ideal (Custo + margem → Melhor preço)",
    hint: "Imposto e taxa da plataforma são calculados sobre o preço de venda, por isso o preço final é maior que a conta simples.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path d="M4 17l5-5 3 3 7-7M14 8h5v5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
};

// Mapa explícito de tom do badge para os 3 tipos.
const tipoTone: Record<TipoCalculo, "accent" | "primary" | "success"> = {
  direto: "accent",
  reverso: "primary",
  vendaIdeal: "success",
};

const tipoBadge: Record<TipoCalculo, string> = {
  direto: "Direto",
  reverso: "Reverso",
  vendaIdeal: "Venda ideal",
};

// Campos obrigatórios de cada modo, para liberar o botão de salvar (RN09/RN14).
const podeSalvar = (form: typeof emptyForm): boolean => {
  if (!form.nome) return false;
  if (form.tipo === "vendaIdeal") {
    return form.custoCompra !== "" && form.margemPercentual !== "";
  }
  return form.precoVenda !== "";
};

// Converte string vazia em undefined: "0" é um valor válido e precisa ir junto.
const numeroOuAusente = (valor: string): number | undefined =>
  valor === "" ? undefined : Number(valor);

const formatarPercentual = (valor: number | string | null | undefined): string =>
  formatPercent(valor, 2);

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
  const [resultado, setResultado] = useState<SimulacaoResultado | null>(null);

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

  // Simulação em tempo real: o backend é a fonte da verdade da fórmula.
  // O payload leva apenas campos de ENTRADA — nunca o resultado — para não
  // criar laço de requisição.
  useEffect(() => {
    const {
      tipo,
      precoVenda,
      custoCompra,
      frete,
      taxaPlataformaPercentual,
      impostoPercentual,
      descontoPlataforma,
      metaVendaAlcancada,
      margemPercentual,
    } = form;

    const completo =
      tipo === "vendaIdeal"
        ? custoCompra !== "" && frete !== "" && margemPercentual !== ""
        : precoVenda !== "" && margemPercentual !== "";

    if (!completo) {
      setResultado(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const saida = await calculosApi.simular({
          tipo,
          precoVenda: numeroOuAusente(precoVenda),
          custoCompra: numeroOuAusente(custoCompra),
          frete: numeroOuAusente(frete),
          taxaPlataformaPercentual: numeroOuAusente(taxaPlataformaPercentual),
          impostoPercentual: numeroOuAusente(impostoPercentual),
          descontoPlataforma: metaVendaAlcancada ? numeroOuAusente(descontoPlataforma) : undefined,
          metaVendaAlcancada,
          margemPercentual: numeroOuAusente(margemPercentual),
        });
        if (!controller.signal.aborted) {
          setResultado(saida);
          setError("");
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setResultado(null);
        setError(err instanceof Error ? err.message : "Não foi possível calcular");
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    form.tipo,
    form.precoVenda,
    form.custoCompra,
    form.frete,
    form.taxaPlataformaPercentual,
    form.impostoPercentual,
    form.descontoPlataforma,
    form.metaVendaAlcancada,
    form.margemPercentual,
  ]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setForm((anterior) => ({ ...anterior, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const { metaVendaAlcancada } = form;

    try {
      await calculosApi.create({
        nome: form.nome,
        tipo: form.tipo,
        precoVenda: numeroOuAusente(form.precoVenda),
        custoCompra: numeroOuAusente(form.custoCompra),
        frete: numeroOuAusente(form.frete),
        taxaPlataformaPercentual: numeroOuAusente(form.taxaPlataformaPercentual),
        impostoPercentual: numeroOuAusente(form.impostoPercentual),
        descontoPlataforma: metaVendaAlcancada ? numeroOuAusente(form.descontoPlataforma) : undefined,
        metaVendaAlcancada,
        margemPercentual: numeroOuAusente(form.margemPercentual),
      });
      setForm(emptyForm);
      setResultado(null);
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
  const margemAbaixoDoDesejado =
    resultado !== null &&
    form.margemPercentual !== "" &&
    resultado.margemObtidaPercentual < Number(form.margemPercentual);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Cálculos de Preço"
        subtitle="Calcule o lucro a partir do preço de venda, o custo máximo ou o melhor preço de venda possível."
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
              <option value="direto">Direto — Preço de venda → Lucro</option>
              <option value="reverso">Reverso — Preço de venda → Custo máximo</option>
              <option value="vendaIdeal">Venda ideal — Custo → Melhor preço</option>
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
                      label="Taxa da plataforma (%)"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="0,00"
                      hint="Calculada sobre o preço de venda"
                      value={form.taxaPlataformaPercentual}
                      onChange={(e) => handleInputChange("taxaPlataformaPercentual", e.target.value)}
                    />
                    <Field
                      label="Imposto (%)"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="0,00"
                      hint="Percentual sobre o preço de venda"
                      value={form.impostoPercentual}
                      onChange={(e) => handleInputChange("impostoPercentual", e.target.value)}
                    />
                  </div>
                  <Field
                    label="Margem desejada (%)"
                    type="number"
                    step="0.01"
                    min="0"
                    max="99.99"
                    placeholder="0,00"
                    hint="Percentual do preço de venda que você quer de lucro"
                    value={form.margemPercentual}
                    onChange={(e) => handleInputChange("margemPercentual", e.target.value)}
                  />
                </>
              ) : form.tipo === "reverso" ? (
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
                  <Field
                    label="Frete (R$)"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={form.frete}
                    onChange={(e) => handleInputChange("frete", e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="Taxa da plataforma (%)"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="0,00"
                      hint="Calculada sobre o preço de venda"
                      value={form.taxaPlataformaPercentual}
                      onChange={(e) => handleInputChange("taxaPlataformaPercentual", e.target.value)}
                    />
                    <Field
                      label="Imposto (%)"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="0,00"
                      hint="Percentual sobre o preço de venda"
                      value={form.impostoPercentual}
                      onChange={(e) => handleInputChange("impostoPercentual", e.target.value)}
                    />
                  </div>
                  <Field
                    label="Margem desejada (%)"
                    type="number"
                    step="0.01"
                    min="0"
                    max="99.99"
                    required
                    placeholder="0,00"
                    hint="Percentual do preço de venda que você quer de lucro"
                    value={form.margemPercentual}
                    onChange={(e) => handleInputChange("margemPercentual", e.target.value)}
                  />
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="Custo de compra (R$)"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0,00"
                      value={form.custoCompra}
                      onChange={(e) => handleInputChange("custoCompra", e.target.value)}
                    />
                    <Field
                      label="Frete (R$)"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0,00"
                      value={form.frete}
                      onChange={(e) => handleInputChange("frete", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="Taxa da plataforma (%)"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      placeholder="0,00"
                      hint="Percentual sobre o preço de venda"
                      value={form.taxaPlataformaPercentual}
                      onChange={(e) => handleInputChange("taxaPlataformaPercentual", e.target.value)}
                    />
                    <Field
                      label="Imposto (%)"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      placeholder="0,00"
                      hint="Percentual sobre o preço de venda"
                      value={form.impostoPercentual}
                      onChange={(e) => handleInputChange("impostoPercentual", e.target.value)}
                    />
                  </div>
                  <Field
                    label="Margem de lucro desejada (%)"
                    type="number"
                    step="0.01"
                    min="0"
                    max="99.99"
                    required
                    placeholder="0,00"
                    hint="Margem mínima sobre o preço de venda"
                    value={form.margemPercentual}
                    onChange={(e) => handleInputChange("margemPercentual", e.target.value)}
                  />

                  <div className="space-y-4 rounded-xl border border-border/50 bg-surface-strong/40 p-4">
                    <label className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border bg-surface-strong accent-primary"
                        checked={form.metaVendaAlcancada}
                        onChange={(e) => handleInputChange("metaVendaAlcancada", e.target.checked)}
                      />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                        Atingi a meta de venda
                      </span>
                    </label>
                    <Field
                      label="Desconto da plataforma (%)"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="0,00"
                      disabled={!form.metaVendaAlcancada}
                      hint="Reduz a taxa da plataforma em cima do valor de venda. Só vale se a meta for atingida."
                      value={form.descontoPlataforma}
                      onChange={(e) => handleInputChange("descontoPlataforma", e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            {resultado && (
              <div className="space-y-3">
                <div className="rounded-xl border border-success/30 bg-success/10 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-success">
                        {form.tipo === "vendaIdeal" ? "Melhor preço de venda" : "Resultado"}
                      </p>
                      <p className="mt-1 text-2xl font-bold tabular-nums text-white">
                        {formatBRL(
                          form.tipo === "vendaIdeal" ? resultado.precoVenda : resultado.resultado,
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted">Margem obtida</p>
                      <p className="font-semibold text-success">
                        {formatarPercentual(resultado.margemObtidaPercentual)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border/50 bg-surface-strong/50 p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Preço de venda</span>
                    <span className="tabular-nums text-white">{formatBRL(resultado.precoVenda)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Custo de compra</span>
                    <span className="tabular-nums text-white">{formatBRL(resultado.custoCompra)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Frete</span>
                    <span className="tabular-nums text-white">{formatBRL(form.frete)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Imposto</span>
                    <span className="tabular-nums text-white">
                      {formatBRL(resultado.valorImposto)}{" "}
                      <span className="text-muted">({formatarPercentual(form.impostoPercentual)})</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Taxa da plataforma</span>
                    <span className="tabular-nums text-white">
                      {formatBRL(resultado.valorTaxa)}{" "}
                      <span className="text-muted">({formatarPercentual(resultado.taxaEfetivaPercentual)})</span>
                    </span>
                  </div>
                  {form.metaVendaAlcancada && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted">Taxa efetiva</span>
                      <span className="tabular-nums text-white">
                        {formatarPercentual(resultado.taxaEfetivaPercentual)} (desconto de{" "}
                        {formatarPercentual(form.descontoPlataforma)} pela meta)
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-border/50 pt-2">
                    <span className="text-muted">
                      {form.tipo === "vendaIdeal" ? "Lucro" : "Resultado"}
                    </span>
                    <span className="tabular-nums font-semibold text-white">
                      {formatBRL(resultado.lucro)}{" "}
                      <span className="text-muted">
                        (margem obtida: {formatarPercentual(resultado.margemObtidaPercentual)})
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Margem desejada</span>
                    <span
                      className={`tabular-nums font-semibold ${
                        margemAbaixoDoDesejado ? "text-danger" : "text-white"
                      }`}
                    >
                      {formatarPercentual(form.margemPercentual)}
                    </span>
                  </div>
                </div>

                {margemAbaixoDoDesejado && (
                  <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-xs text-danger">
                    A margem obtida está abaixo da margem desejada. Ajuste o preço de venda ou os
                    percentuais para chegar no valor esperado.
                  </div>
                )}
              </div>
            )}

            <Button type="submit" className="w-full py-3" disabled={!podeSalvar(form)}>
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
                    <Th>Taxa (%)</Th>
                    <Th>Imposto (%)</Th>
                    <Th>Lucro (R$)</Th>
                    <Th>Margem (%)</Th>
                    <Th>Criado em</Th>
                    <Th className="text-right w-24">Ações</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {calculos.map((c) => (
                    <tr key={c.id} className="transition-colors hover:bg-black/5">
                      <Td className="max-w-[250px] truncate font-semibold text-white">{c.nome}</Td>
                      <Td>
                        <Badge tone={tipoTone[c.tipo]}>{tipoBadge[c.tipo]}</Badge>
                      </Td>
                      <Td className="tabular-nums text-muted">{formatBRL(c.precoVenda)}</Td>
                      <Td className="tabular-nums text-muted">{formatBRL(c.custoCompra)}</Td>
                      <Td className="tabular-nums text-muted">
                        {formatPercent(c.taxaEfetivaPercentual ?? c.taxaPlataformaPercentual, 2)}
                      </Td>
                      <Td className="tabular-nums text-muted">{formatPercent(c.impostoPercentual, 2)}</Td>
                      <Td className="tabular-nums font-semibold text-white">{formatBRL(c.lucro ?? c.resultado)}</Td>
                      <Td className="tabular-nums font-medium text-primary">
                        {formatPercent(c.margemObtidaPercentual ?? c.margemPercentual, 2)}
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