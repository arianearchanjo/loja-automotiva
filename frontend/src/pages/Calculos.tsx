import { useEffect, useState } from "react";
import { calculosApi, type Calculo } from "../lib/api";

export default function Calculos() {
  const [calculos, setCalculos] = useState<Calculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nome: "",
    tipo: "direto" as "direto" | "reverso",
    precoVenda: "",
    custoCompra: "",
    frete: "",
    taxaPlataforma: "",
    margemDesejada: "",
    resultado: "",
  });

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
      setForm({
        nome: "",
        tipo: "direto",
        precoVenda: "",
        custoCompra: "",
        frete: "",
        taxaPlataforma: "",
        margemDesejada: "",
        resultado: "",
      });
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
      alert(err instanceof Error ? err.message : "Erro ao excluir");
    }
  };

  return (
    <div className="px-4 sm:px-0">
      <h1 className="text-2xl font-bold text-white mb-6">Cálculos de Preço</h1>

      <div className="bg-surface border border-border shadow sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-white mb-4">Novo Cálculo</h2>
          {error && (
            <div className="mb-4 bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-muted">Nome</label>
              <input
                type="text"
                required
                className="mt-1 block w-full border border-border bg-surface-strong text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted">Tipo</label>
              <select
                className="mt-1 block w-full border border-border bg-surface-strong text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={form.tipo}
                onChange={(e) =>
                  setForm({ ...form, tipo: e.target.value as "direto" | "reverso" })
                }
              >
                <option value="direto">Direto</option>
                <option value="reverso">Reverso</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted">Preço de Venda</label>
              <input
                type="number"
                step="0.01"
                className="mt-1 block w-full border border-border bg-surface-strong text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={form.precoVenda}
                onChange={(e) => setForm({ ...form, precoVenda: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted">Custo Compra</label>
              <input
                type="number"
                step="0.01"
                className="mt-1 block w-full border border-border bg-surface-strong text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={form.custoCompra}
                onChange={(e) => setForm({ ...form, custoCompra: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted">Frete</label>
              <input
                type="number"
                step="0.01"
                className="mt-1 block w-full border border-border bg-surface-strong text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={form.frete}
                onChange={(e) => setForm({ ...form, frete: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted">Taxa Plataforma</label>
              <input
                type="number"
                step="0.01"
                className="mt-1 block w-full border border-border bg-surface-strong text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={form.taxaPlataforma}
                onChange={(e) => setForm({ ...form, taxaPlataforma: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted">Margem Desejada</label>
              <input
                type="number"
                step="0.01"
                className="mt-1 block w-full border border-border bg-surface-strong text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={form.margemDesejada}
                onChange={(e) => setForm({ ...form, margemDesejada: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted">Resultado</label>
              <input
                type="number"
                step="0.01"
                className="mt-1 block w-full border border-border bg-surface-strong text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={form.resultado}
                onChange={(e) => setForm({ ...form, resultado: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-surface border border-border shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-white mb-4">Histórico</h2>
          {loading ? (
            <p className="text-muted">Carregando...</p>
          ) : calculos.length === 0 ? (
            <p className="text-muted">Nenhum cálculo registrado.</p>
          ) : (
            <ul className="divide-y divide-border">
              {calculos.map((c) => (
                <li key={c.id} className="py-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-white">{c.nome}</p>
                    <p className="text-sm text-muted">
                      {c.tipo} • {new Date(c.criadoEm).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Excluir
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
