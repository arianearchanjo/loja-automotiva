import { useEffect, useState } from "react";
import { vendasApi, type Venda } from "../lib/api";

export default function Vendas() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    receita: "",
    custoTotal: "",
    dataVenda: "",
  });

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
        receita: form.receita,
        custoTotal: form.custoTotal,
        dataVenda: form.dataVenda,
      });
      setForm({ receita: "", custoTotal: "", dataVenda: "" });
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
      alert(err instanceof Error ? err.message : "Erro ao excluir");
    }
  };

  return (
    <div className="px-4 sm:px-0">
      <h1 className="text-2xl font-bold text-white mb-6">Vendas</h1>

      <div className="bg-surface border border-border shadow sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-white mb-4">Nova Venda</h2>
          {error && (
            <div className="mb-4 bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-muted">Receita</label>
              <input
                type="number"
                step="0.01"
                required
                className="mt-1 block w-full border border-border bg-surface-strong text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={form.receita}
                onChange={(e) => setForm({ ...form, receita: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted">Custo Total</label>
              <input
                type="number"
                step="0.01"
                required
                className="mt-1 block w-full border border-border bg-surface-strong text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={form.custoTotal}
                onChange={(e) => setForm({ ...form, custoTotal: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted">Data da Venda</label>
              <input
                type="date"
                required
                className="mt-1 block w-full border border-border bg-surface-strong text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={form.dataVenda}
                onChange={(e) => setForm({ ...form, dataVenda: e.target.value })}
              />
            </div>
            <div className="sm:col-span-3">
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
          ) : vendas.length === 0 ? (
            <p className="text-muted">Nenhuma venda registrada.</p>
          ) : (
            <ul className="divide-y divide-border">
              {vendas.map((v) => (
                <li key={v.id} className="py-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Receita: R$ {Number(v.receita).toFixed(2)} • Lucro: R$ {Number(v.lucroBruto).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted">
                      {new Date(v.dataVenda).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(v.id)}
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
