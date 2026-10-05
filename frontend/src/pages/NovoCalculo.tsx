import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { calculosApi, type SimulacaoResultado } from "../lib/api";
import { Button, Card, CardHeader, Field, PageHeader, Select } from "../components/ui";
import { formatBRL, formatPercent } from "../lib/format";

type TipoCalculo = "direto" | "reverso" | "vendaIdeal";

const emptyForm = {
  nome: "",
  tipo: "vendaIdeal" as TipoCalculo,
  precoVenda: "",
  custoCompra: "",
  frete: "",
  taxaPlataformaPercentual: "",
  impostoPercentual: "",
  descontoPlataforma: "",
  metaVendaAlcancada: false,
  margemPercentual: "",
};

type CalculoForm = typeof emptyForm;

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
    hint: "Imposto e taxa da plataforma incidem sobre o preço de venda, por isso o preço final é maior que a conta simples.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path d="M4 17l5-5 3 3 7-7M14 8h5v5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
};

// Campos que a API e o motor exigem por tipo de cálculo (RN09/RN14).
const camposObrigatorios: Record<TipoCalculo, (keyof CalculoForm)[]> = {
  direto: ["nome", "precoVenda", "custoCompra", "margemPercentual"],
  reverso: ["nome", "precoVenda", "frete", "margemPercentual"],
  vendaIdeal: ["nome", "custoCompra", "frete", "margemPercentual"],
};

const completoParaSimular = (form: CalculoForm): boolean =>
  camposObrigatorios[form.tipo].slice(1).every((campo) => form[campo] !== "");

// Input de texto com teclado numérico no mobile: aceita vírgula OU ponto decimal (RN11).
const campoDecimal = {
  type: "text",
  inputMode: "decimal",
  placeholder: "0,00",
} as const;

// Aceita vírgula ou ponto decimal e descarta o que não for número (RN11).
function toNumber(valor: string): number {
  const parsed = Number(valor.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

// String vazia vira undefined; "0" é valor válido e precisa ir junto.
const numeroOuAusente = (valor: string): number | undefined =>
  valor.trim() === "" ? undefined : toNumber(valor);

const formatarPercentual = (valor: number | string | null | undefined): string =>
  formatPercent(valor, 2);

const formulas: Record<TipoCalculo, string> = {
  direto: "lucro = V − C − F − imposto − taxa",
  reverso: "custo máximo = V − F − imposto − taxa − margem",
  vendaIdeal: "V = (C + F) ÷ (1 − imposto − taxa efetiva − margem)",
};

const dicaPreenchimento: Record<TipoCalculo, string> = {
  direto: "Informe o preço de venda, o custo de compra e a margem desejada.",
  reverso: "Informe o preço de venda alvo, o frete e a margem desejada.",
  vendaIdeal: "Informe o custo de compra, o frete e a margem desejada.",
};

type LinhaDetalhamento = {
  rotulo: string;
  valor: number;
  sufixo?: string;
  destaque?: boolean;
};

type Destaque = {
  rotulo: string;
  valor: number;
  lateralRotulo: string;
  lateralValor: string;
  lateralNota?: string;
};

function IconSetaEsquerda() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Detalhamento em linhas, com a última em destaque (o total do modo).
function ResultadoDetalhado({ linhas }: { linhas: LinhaDetalhamento[] }) {
  return (
    <div className="rounded-xl border border-border/50 bg-surface-strong/50 p-3 space-y-2">
      {linhas.map((linha) => (
        <div
          key={linha.rotulo}
          className={`flex items-center justify-between ${linha.destaque ? "border-t border-border/50 pt-2" : ""}`}
        >
          <span className={linha.destaque ? "text-sm font-semibold text-primary" : "text-muted"}>
            {linha.rotulo}
          </span>
          <span className={`tabular-nums ${linha.destaque ? "font-bold text-success" : "text-white"}`}>
            {formatBRL(linha.valor)}
            {linha.sufixo && <span className="ml-1 font-normal text-muted">{linha.sufixo}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function NovoCalculo() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CalculoForm>(emptyForm);
  const [resultado, setResultado] = useState<SimulacaoResultado | null>(null);
  // Erro de cálculo (percentuais inválidos, margem impossível) fica separado
  // dos erros de API para poder usar o painel dedicado.
  const [erroCalculo, setErroCalculo] = useState("");

  useEffect(() => {
    if (!completoParaSimular(form)) {
      setResultado(null);
      setErroCalculo("");
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const saida = await calculosApi.simular({
          tipo: form.tipo,
          precoVenda: numeroOuAusente(form.precoVenda),
          custoCompra: numeroOuAusente(form.custoCompra),
          frete: numeroOuAusente(form.frete),
          taxaPlataformaPercentual: numeroOuAusente(form.taxaPlataformaPercentual),
          impostoPercentual: numeroOuAusente(form.impostoPercentual),
          descontoPlataforma: form.metaVendaAlcancada
            ? numeroOuAusente(form.descontoPlataforma)
            : undefined,
          metaVendaAlcancada: form.metaVendaAlcancada,
          margemPercentual: numeroOuAusente(form.margemPercentual),
        });
        if (controller.signal.aborted) return;
        setResultado(saida);
        setErroCalculo("");
        setError("");
      } catch (err) {
        if (controller.signal.aborted) return;
        setResultado(null);
        setErroCalculo(err instanceof Error ? err.message : "Não foi possível calcular");
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
    if (saving) return;

    const { metaVendaAlcancada } = form;

    setSaving(true);
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
      navigate("/calculos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const currentTipo = tipoLabels[form.tipo];
  const taxaInformada = numeroOuAusente(form.taxaPlataformaPercentual) ?? 0;
  const descontoInformado = numeroOuAusente(form.descontoPlataforma) ?? 0;
  const taxaEfetiva = resultado?.taxaEfetivaPercentual;

  const margemAbaixoDoDesejado =
    resultado !== null &&
    form.margemPercentual !== "" &&
    resultado.margemObtidaPercentual < toNumber(form.margemPercentual);

  // Cada modo conta uma história diferente, então o total e as linhas mudam.
  const linhas: LinhaDetalhamento[] = (() => {
    if (!resultado) return [];

    const imposto = {
      rotulo: `Imposto ${formatarPercentual(form.impostoPercentual)}`,
      valor: resultado.valorImposto,
    };
    const taxa = {
      rotulo: `Taxa ${formatarPercentual(taxaInformada)}`,
      valor: resultado.valorTaxa,
    };
    const linhaTaxaEfetiva =
      form.metaVendaAlcancada && descontoInformado > 0
        ? {
            rotulo: `Taxa efetiva ${formatarPercentual(taxaEfetiva)}`,
            valor: resultado.valorTaxa,
          }
        : null;

    if (form.tipo === "direto") {
      return [
        { rotulo: "Preço de venda", valor: resultado.precoVenda ?? 0 },
        { rotulo: "Custo de compra", valor: resultado.custoCompra ?? 0 },
        { rotulo: "Frete", valor: toNumber(form.frete) },
        imposto,
        taxa,
        ...(linhaTaxaEfetiva ? [linhaTaxaEfetiva] : []),
        {
          rotulo: "Lucro",
          valor: resultado.lucro,
          sufixo: `margem ${formatarPercentual(resultado.margemObtidaPercentual)}`,
          destaque: true,
        },
      ];
    }

    if (form.tipo === "reverso") {
      return [
        { rotulo: "Preço de venda alvo", valor: resultado.precoVenda ?? 0 },
        { rotulo: "Frete", valor: toNumber(form.frete) },
        imposto,
        taxa,
        {
          rotulo: `Margem desejada ${formatarPercentual(form.margemPercentual)}`,
          valor: ((resultado.precoVenda ?? 0) * toNumber(form.margemPercentual)) / 100,
        },
        ...(linhaTaxaEfetiva ? [linhaTaxaEfetiva] : []),
        {
          rotulo: "Custo máximo de compra",
          valor: resultado.custoCompra ?? resultado.resultado,
          sufixo: `margem ${formatarPercentual(resultado.margemObtidaPercentual)}`,
          destaque: true,
        },
      ];
    }

    return [
      { rotulo: "Custo de compra", valor: resultado.custoCompra ?? 0 },
      { rotulo: "Frete", valor: toNumber(form.frete) },
      imposto,
      taxa,
      ...(linhaTaxaEfetiva ? [linhaTaxaEfetiva] : []),
      {
        rotulo: "Lucro",
        valor: resultado.lucro,
        sufixo: `margem ${formatarPercentual(resultado.margemObtidaPercentual)}`,
      },
      {
        rotulo: "Venda",
        valor: resultado.precoVenda ?? resultado.resultado,
        destaque: true,
      },
    ];
  })();

  const destaque: Destaque | null = (() => {
    if (!resultado) return null;
    if (form.tipo === "direto") {
      return {
        rotulo: "Lucro",
        valor: resultado.lucro,
        lateralRotulo: "Margem obtida",
        lateralValor: formatarPercentual(resultado.margemObtidaPercentual),
      };
    }
    if (form.tipo === "reverso") {
      return {
        rotulo: "Custo máximo de compra",
        valor: resultado.custoCompra ?? resultado.resultado,
        lateralRotulo: "Margem obtida",
        lateralValor: formatarPercentual(resultado.margemObtidaPercentual),
      };
    }
    return {
      rotulo: "Melhor preço de venda",
      valor: resultado.precoVenda ?? resultado.resultado,
      lateralRotulo: "Lucro",
      lateralValor: formatBRL(resultado.lucro),
      lateralNota: `${formatarPercentual(resultado.margemObtidaPercentual)} da venda`,
    };
  })();

  const canSubmit =
    !saving &&
    completoParaSimular(form) &&
    form.nome !== "" &&
    resultado !== null &&
    erroCalculo === "";

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Novo cálculo"
        subtitle="Informe custo, frete e percentuais e descubra o preço de venda que sobra exatamente a margem desejada."
        action={
          <Button variant="ghost" onClick={() => navigate("/calculos")}>
            <IconSetaEsquerda />
            Voltar para a lista
          </Button>
        }
      />

      {error && (
        <div className="mb-6 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger animate-fade-in">
          {error}
        </div>
      )}

      <div className="mx-auto w-full max-w-5xl">
        <Card>
          <CardHeader title="Dados do cálculo" subtitle="Preencha os dados e veja o resultado em tempo real" />
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
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
                    {...campoDecimal}
                    required
                    value={form.precoVenda}
                    onChange={(e) => handleInputChange("precoVenda", e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="Custo de compra (R$)"
                      {...campoDecimal}
                      required
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
                      hint="Calculada sobre o preço de venda"
                      value={form.taxaPlataformaPercentual}
                      onChange={(e) => handleInputChange("taxaPlataformaPercentual", e.target.value)}
                    />
                    <Field
                      label="Imposto (%)"
                      {...campoDecimal}
                      hint="Percentual sobre o preço de venda"
                      value={form.impostoPercentual}
                      onChange={(e) => handleInputChange("impostoPercentual", e.target.value)}
                    />
                  </div>
                  <Field
                    label="Margem desejada (%)"
                    {...campoDecimal}
                    required
                    hint="Percentual do preço de venda que você quer de lucro"
                    value={form.margemPercentual}
                    onChange={(e) => handleInputChange("margemPercentual", e.target.value)}
                  />
                </>
              ) : form.tipo === "reverso" ? (
                <>
                  <Field
                    label="Preço de venda alvo (R$)"
                    {...campoDecimal}
                    required
                    value={form.precoVenda}
                    onChange={(e) => handleInputChange("precoVenda", e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="Frete (R$)"
                      {...campoDecimal}
                      required
                      value={form.frete}
                      onChange={(e) => handleInputChange("frete", e.target.value)}
                    />
                    <Field
                      label="Custo de compra (R$)"
                      {...campoDecimal}
                      hint="Calculado automaticamente"
                      value=""
                      disabled
                      readOnly
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="Taxa da plataforma (%)"
                      {...campoDecimal}
                      hint="Calculada sobre o preço de venda"
                      value={form.taxaPlataformaPercentual}
                      onChange={(e) => handleInputChange("taxaPlataformaPercentual", e.target.value)}
                    />
                    <Field
                      label="Imposto (%)"
                      {...campoDecimal}
                      hint="Percentual sobre o preço de venda"
                      value={form.impostoPercentual}
                      onChange={(e) => handleInputChange("impostoPercentual", e.target.value)}
                    />
                  </div>
                  <Field
                    label="Margem desejada (%)"
                    {...campoDecimal}
                    required
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
                      {...campoDecimal}
                      required
                      value={form.custoCompra}
                      onChange={(e) => handleInputChange("custoCompra", e.target.value)}
                    />
                    <Field
                      label="Frete (R$)"
                      {...campoDecimal}
                      required
                      value={form.frete}
                      onChange={(e) => handleInputChange("frete", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="Taxa da plataforma (%)"
                      {...campoDecimal}
                      hint="Percentual sobre o preço de venda"
                      value={form.taxaPlataformaPercentual}
                      onChange={(e) => handleInputChange("taxaPlataformaPercentual", e.target.value)}
                    />
                    <Field
                      label="Imposto (%)"
                      {...campoDecimal}
                      hint="Percentual sobre o preço de venda"
                      value={form.impostoPercentual}
                      onChange={(e) => handleInputChange("impostoPercentual", e.target.value)}
                    />
                  </div>
                  <Field
                    label="Margem de lucro desejada (%)"
                    {...campoDecimal}
                    required
                    hint="Margem mínima sobre o preço de venda"
                    value={form.margemPercentual}
                    onChange={(e) => handleInputChange("margemPercentual", e.target.value)}
                  />
                </>
              )}
            </div>

            <div className="space-y-4 rounded-xl border border-border/50 bg-surface-strong/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Desconto de taxa por meta de vendas
              </p>
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
                {...campoDecimal}
                disabled={!form.metaVendaAlcancada}
                hint="Reduz a taxa da plataforma em cima do valor de venda. Só vale se a meta for atingida."
                value={form.descontoPlataforma}
                onChange={(e) => handleInputChange("descontoPlataforma", e.target.value)}
              />
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Taxa original</span>
                  <span className="tabular-nums text-white">{formatarPercentual(taxaInformada)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Desconto aplicado</span>
                  <span className="tabular-nums text-white">
                    {form.metaVendaAlcancada
                      ? formatarPercentual(descontoInformado)
                      : "meta não atingida"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-border/50 pt-2">
                  <span className="text-muted">Taxa efetiva (usada no cálculo)</span>
                  <span className="tabular-nums font-semibold text-white">
                    {taxaEfetiva === undefined ? "—" : formatarPercentual(taxaEfetiva)}
                  </span>
                </div>
              </div>
            </div>

            {erroCalculo ? (
              <div className="rounded-xl border border-danger/30 bg-danger/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-danger">
                  Cálculo impossível
                </p>
                <p className="mt-1 text-sm text-danger">{erroCalculo}</p>
              </div>
            ) : resultado && destaque ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-success/30 bg-success/10 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-success">
                        {destaque.rotulo}
                      </p>
                      <p className="mt-1 text-3xl font-bold tabular-nums text-white sm:text-4xl">
                        {formatBRL(destaque.valor)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-muted">{destaque.lateralRotulo}</p>
                      <p className="text-lg font-semibold tabular-nums text-success">
                        {destaque.lateralValor}
                      </p>
                      {destaque.lateralNota && (
                        <p className="text-xs text-muted">{destaque.lateralNota}</p>
                      )}
                    </div>
                  </div>
                </div>
                <ResultadoDetalhado linhas={linhas} />
                {margemAbaixoDoDesejado ? (
                  <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-xs text-danger">
                    A margem obtida está abaixo da margem desejada. Ajuste o preço de venda ou os
                    percentuais para chegar no valor esperado.
                  </div>
                ) : (
                  <p className="text-xs text-muted">{formulas[form.tipo]}</p>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 bg-surface-strong/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Fórmula</p>
                <p className="mt-1 text-sm text-white">{formulas[form.tipo]}</p>
                <p className="mt-2 text-xs text-muted">{dicaPreenchimento[form.tipo]}</p>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" className="flex-1 py-3" disabled={!canSubmit}>
                {saving ? "Salvando..." : "Salvar cálculo"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="py-3"
                onClick={() => navigate("/calculos")}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
