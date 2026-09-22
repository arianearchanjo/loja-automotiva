import { useEffect, useMemo, useState } from "react";
import { calculosApi, vendasApi, type Calculo, type Venda } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Badge, Card, CardHeader, EmptyState, PageHeader, Stat, Td, Th } from "../components/ui";
import { formatBRL, formatDate, formatDateTime, formatPercent } from "../lib/format";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

function IconMoney() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <circle cx="12" cy="12.5" r="3" />
      <path d="M6.5 9h.01M17.5 16h.01" strokeLinecap="round" />
    </svg>
  );
}

function IconTrend() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M3 17l5-5 4 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 8h4v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCalc() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h.01M13 12h.01M9 16h.01M13 16h.01" strokeLinecap="round" />
    </svg>
  );
}

function monthKey(date: string): string {
  return new Date(date).toISOString().slice(0, 7);
}

export default function Dashboard() {
  const { user } = useAuth();
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [calculos, setCalculos] = useState<Calculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([vendasApi.list(), calculosApi.list()])
      .then(([v, c]) => {
        setVendas(v);
        setCalculos(c);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar dados"))
      .finally(() => setLoading(false));
  }, []);

  const kpis = useMemo(() => {
    const receita = vendas.reduce((acc, v) => acc + Number(v.receita), 0);
    const custo = vendas.reduce((acc, v) => acc + Number(v.custoTotal), 0);
    const lucro = vendas.reduce((acc, v) => acc + Number(v.lucroBruto), 0);
    const margem = receita > 0 ? (lucro / receita) * 100 : 0;
    return { receita, custo, lucro, margem };
  }, [vendas]);

  const monthly = useMemo(() => {
    const now = new Date();
    const map = new Map<string, { receita: number; custo: number; lucro: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, { receita: 0, custo: 0, lucro: 0 });
    }
    for (const v of vendas) {
      const key = monthKey(v.dataVenda);
      const entry = map.get(key);
      if (entry) {
        entry.receita += Number(v.receita);
        entry.custo += Number(v.custoTotal);
        entry.lucro += Number(v.lucroBruto);
      }
    }
    return [...map.entries()].map(([key, value]) => ({
      label: new Date(`${key}-01T00:00:00`).toLocaleDateString("pt-BR", { month: "short" }),
      ...value,
    }));
  }, [vendas]);

  const maxLucro = Math.max(...monthly.map((m) => m.lucro), 0) || 1;
  const recentVendas = [...vendas].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)).slice(0, 5);
  const recentCalculos = [...calculos].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)).slice(0, 5);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={`Olá, ${user?.name?.split(" ")[0] ?? ""}`}
        subtitle="Resumo geral do seu movimento comercial e financeiro."
      />

      {error && (
        <div className="mb-6 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-muted">Carregando dados...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Receita total" value={formatBRL(kpis.receita)} delta={`${vendas.length} venda(s) registrada(s)`} icon={<IconMoney />} />
            <Stat label="Custo total" value={formatBRL(kpis.custo)} icon={<IconTrend />} />
            <Stat label="Lucro bruto" value={formatBRL(kpis.lucro)} icon={<IconTrend />} />
            <Stat label="Margem média" value={formatPercent(kpis.margem)} delta={`${calculos.length} cálculo(s) salvos`} icon={<IconCalc />} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
            <Card className="p-5 lg:col-span-3">
              <CardHeader title="Evolução mensal" subtitle="Receita, custo e lucro dos últimos 6 meses" />
              <div className="mt-6 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthly}>
                    <defs>
                      <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a0a7b0" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#a0a7b0" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#23262b",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                      }}
                      labelStyle={{ color: "#d9dce0", fontWeight: 600 }}
                      itemStyle={{ fontSize: "13px" }}
                      formatter={(value: number) => [formatBRL(value)]}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="receita" name="Receita" stroke="#a0a7b0" fill="url(#colorReceita)" strokeWidth={2} />
                    <Area type="monotone" dataKey="custo" name="Custo" stroke="#8b919a" fill="rgba(139,145,154,0.1)" strokeWidth={2} strokeDasharray="5 5" />
                    <Area type="monotone" dataKey="lucro" name="Lucro" stroke="#22c55e" fill="url(#colorLucro)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader title="Últimas vendas" subtitle="Registros mais recentes" />
              <div className="mt-4 divide-y divide-border/70">
                {recentVendas.length === 0 ? (
                  <EmptyState title="Nenhuma venda ainda" hint="Cadastre vendas na página de Vendas." />
                ) : (
                  recentVendas.map((v) => (
                    <div key={v.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{formatBRL(v.receita)}</p>
                        <p className="text-xs text-muted">{formatDate(v.dataVenda)}</p>
                      </div>
                      <Badge tone={Number(v.lucroBruto) >= 0 ? "success" : "danger"}>
                        {Number(v.lucroBruto) >= 0 ? "+" : ""}
                        {formatBRL(v.lucroBruto)}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <Card className="mt-6 overflow-hidden">
            <CardHeader title="Cálculos recentes" subtitle="Preço de venda direto e reverso" />
            <div className="mt-4 overflow-x-auto">
              {recentCalculos.length === 0 ? (
                <EmptyState title="Nenhum cálculo ainda" hint="Use a página de Cálculos de Preço para começar." />
              ) : (
                <table className="w-full text-left">
                  <thead className="sr-only sm:not-sr-only">
                    <tr>
                      <Th>Nome</Th>
                      <Th>Tipo</Th>
                      <Th>Preço de venda</Th>
                      <Th>Resultado</Th>
                      <Th>Criado em</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {recentCalculos.map((c) => (
                      <tr key={c.id} className="transition-colors hover:bg-black/5">
                        <Td className="font-medium text-white">{c.nome}</Td>
                        <Td>
                          <Badge tone={c.tipo === "direto" ? "accent" : "primary"}>{c.tipo}</Badge>
                        </Td>
                        <Td className="tabular-nums text-muted">{formatBRL(c.precoVenda)}</Td>
                        <Td className="tabular-nums font-semibold text-white">{formatBRL(c.resultado)}</Td>
                        <Td className="text-muted">{formatDateTime(c.criadoEm)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}