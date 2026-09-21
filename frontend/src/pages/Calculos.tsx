import { useEffect, useState } from "react";
import { calculosApi, type Calculo } from "../lib/api";
import { Badge, Button, Card, CardHeader, EmptyState, Field, PageHeader, Select, Td, Th } from "../components/ui";
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

export default function Calculos() {
  const [calculos, setCalculos] = useState<Calculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);

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

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Cálculos de Preço"
        subtitle="Calcule o preço de venda (direto) ou descubra o quanto pode gastar (reverso)."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader title="Novo cálculo" subtitle="Preencha os dados e salve" />
          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            {error && (
              <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            <Field
              label="Nome"
              required
              placeholder="Ex.: Kit freio dianteiro"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
            <Select
              label="Tipo"
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value as "direto" | "reverso" })}
            >
              <option value="direto">Direto</option>
              <option value="reverso">Reverso</option>
            </Select>
            <Field
              label="Preço de venda (R$)"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={form.precoVenda}
              onChange={(e) => setForm({ ...form, precoVenda: e.target.value })}
            />
            <Field
              label="Custo de compra (R$)"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={form.custoCompra}
              onChange={(e) => setForm({ ...form, custoCompra: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Frete (R$)"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={form.frete}
                onChange={(e) => setForm({ ...form, frete: e.target.value })}
              />
              <Field
                label="Taxa plataforma (R$)"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={form.taxaPlataforma}
                onChange={(e) => setForm({ ...form, taxaPlataforma: e.target.value })}
              />
            </div>
            <Field
              label="Margem desejada (R$)"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={form.margemDesejada}
              onChange={(e) => setForm({ ...form, margemDesejada: e.target.value })}
            />
            <Field
              label="Resultado (R$)"
              type="number"
              step="0.01"
              placeholder="0,00"
              hint="Obtido automaticamente no motor de cálculos"
              value={form.resultado}
              onChange={(e) => setForm({ ...form, resultado: e.target.value })}
            />
            <Button type="submit" className="w-full">
              Salvar cálculo
            </Button>
          </form>
        </Card>

        <Card className="overflow-hidden xl:col-span-2">
          <CardHeader title="Histórico" subtitle={`${calculos.length} cálculo(s) salvo(s)`} />
          <div className="mt-4 overflow-x-auto">
            {loading ? (
              <p className="px-5 py-10 text-center text-muted">Carregando...</p>
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
                    <Th>Criado em</Th>
                    <Th className="sr-only">Ações</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {calculos.map((c) => (
                    <tr key={c.id} className="transition-colors hover:bg-black/5">
                      <Td className="max-w-[220px] truncate font-semibold text-white">{c.nome}</Td>
                      <Td>
                        <Badge tone={c.tipo === "direto" ? "accent" : "primary"}>{c.tipo}</Badge>
                      </Td>
                      <Td className="tabular-nums text-muted">{formatBRL(c.precoVenda)}</Td>
                      <Td className="tabular-nums text-muted">{formatBRL(c.custoCompra)}</Td>
                      <Td className="tabular-nums font-semibold text-white">{formatBRL(c.resultado)}</Td>
                      <Td className="text-muted">{formatDateTime(c.criadoEm)}</Td>
                      <Td className="text-right">
                        <Button variant="danger" onClick={() => handleDelete(c.id)}>
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