import { useEffect, useState } from "react";
import { analisesApi, type Analise } from "../lib/api";

export default function Analises() {
  const [analises, setAnalises] = useState<Analise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    periodoInicio: "",
    periodoFim: "",
  });

  const load = async () => {
    try {
      const data = await analisesApi.list();
      setAnalises(data);
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
      await analisesApi.create({
        periodoInicio: form.periodoInicio,
        periodoFim: form.periodoFim,
      });
      setForm({ periodoInicio: "", periodoFim: "" });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta análise?")) return;
    try {
      await analisesApi.delete(id);
      setAnalises((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao excluir");
    }
  };

  return (
    <div className="px-4 sm:px-0">
      <h1 className="text-2xl font-bold text-white mb-6">Análises Financeiras</h1>

      <div className="bg-surface border border-border shadow sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-white mb-4">Nova Análise</h2>
          {error && (
            <div className="mb-4 bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-muted">Período Início</label>
              <input
                type="date"
                required
                className="mt-1 block w-full border border-border bg-surface-strong text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={form.periodoInicio}
                onChange={(e) => setForm({ ...form, periodoInicio: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted">Período Fim</label>
              <input
                type="date"
                required
                className="mt-1 block w-full border border-border bg-surface-strong text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={form.periodoFim}
                onChange={(e) => setForm({ ...form, periodoFim: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Gerar Análise
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
          ) : analises.length === 0 ? (
            <p className="text-muted">Nenhuma análise registrada.</p>
          ) : (
            <ul className="divide-y divide-border">
              {analises.map((a) => (
                <li key={a.id} className="py-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Receita: R$ {Number(a.receitaTotal).toFixed(2)} • Lucro: R$ {Number(a.lucroTotal).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted">
                      {new Date(a.periodoInicio).toLocaleDateString()} - {new Date(a.periodoFim).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(a.id)}
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
