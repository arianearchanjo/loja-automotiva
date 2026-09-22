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

  const calculateResult = () => {
    const pv = Number(form.precoVenda) || 0;
    const cc = Number(form.custoCompra) || 0;
    const frete = Number(form.frete) || 0;
    const taxa = Number(form.taxaPlataforma) || 0;
    const margem = Number(form.margemDesejada) || 0;

    if (form.tipo === "direto" && pv > 0) {
      const resultado = pv - cc - frete - taxa - margem;
      setForm({ ...form, resultado: String(resultado.toFixed(2)) });
      setShowResult(true);
    } else if (form.tipo === "reverso" && margem > 0) {
      const resultado = pv - frete - taxa - margem;
      setForm({ ...form, custoCompra: String(resultado.toFixed(2)), resultado: String(resultado.toFixed(2)) });
      setShowResult(true);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setShowResult(false);
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
        action={<Stat label="Total" value={calculos.length} icon={<IconCalculator />} />}
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
              onChange={(e) => {
                handleInputChange("tipo", e.target.value);
                setShowResult(false);
              }}
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
            )}

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
                        <Button variant="danger" size="sm" onClick={() => handleDelete(c.id)}>
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