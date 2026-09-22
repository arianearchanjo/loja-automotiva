import { useEffect, useMemo, useState } from "react";
import { vendasApi, type Venda, type Analise } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Badge, Card, CardHeader, EmptyState, PageHeader, Select, Td, Th, Button, Stat } from "../components/ui";
import { formatBRL, formatDate, formatPercent } from "../lib/format";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, subMonths, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = ["#a0a7b0", "#8b919a", "#6b7280", "#4b5563", "#374151"];

function IconDownload() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M23 4v6h-6M1 20v-6h6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconMoney() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <circle cx="12" cy="12.5" r="3" />
      <path d="M6.5 9h.01M17.5 16h.01" strokeLinecap="round" />
    </svg>
  );
}

export default function Relatorios() {
  const { user } = useAuth();
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [periodo, setPeriodo] = useState<"mes" | "trimestre" | "semestre" | "ano">("mes");

  useEffect(() => {
    vendasApi.list()
      .then(setVendas)
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar dados"))
      .finally(() => setLoading(false));
  }, []);

  const filteredVendas = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (periodo) {
      case "mes":
        startDate = startOfMonth(now);
        break;
      case "trimestre":
        startDate = startOfMonth(subMonths(now, 3));
        break;
      case "semestre":
        startDate = startOfMonth(subMonths(now, 6));
        break;
      case "ano":
        startDate = startOfMonth(subMonths(now, 12));
        break;
    }

    return vendas.filter((v) => new Date(v.dataVenda) >= startDate);
  }, [vendas, periodo]);

  const kpis = useMemo(() => {
    const receita = filteredVendas.reduce((acc, v) => acc + Number(v.receita), 0);
    const custo = filteredVendas.reduce((acc, v) => acc + Number(v.custoTotal), 0);
    const lucro = filteredVendas.reduce((acc, v) => acc + Number(v.lucroBruto), 0);
    const margem = receita > 0 ? (lucro / receita) * 100 : 0;
    const ticketMedio = filteredVendas.length > 0 ? receita / filteredVendas.length : 0;
    return { receita, custo, lucro, margem, ticketMedio, count: filteredVendas.length };
  }, [filteredVendas]);

  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = periodo === "mes" ? 1 : periodo === "trimestre" ? 3 : periodo === "semestre" ? 6 : 12;
    const map = new Map<string, { receita: number; custo: number; lucro: number; label: string }>();

    for (let i = months - 1; i >= 0; i--) {
      const d = startOfMonth(subMonths(now, i));
      const key = format(d, "yyyy-MM");
      const label = format(d, "MMM/yy", { locale: ptBR });
      map.set(key, { receita: 0, custo: 0, lucro: 0, label });
    }

    for (const v of filteredVendas) {
      const key = format(new Date(v.dataVenda), "yyyy-MM");
      const entry = map.get(key);
      if (entry) {
        entry.receita += Number(v.receita);
        entry.custo += Number(v.custoTotal);
        entry.lucro += Number(v.lucroBruto);
      }
    }

    return [...map.values()];
  }, [filteredVendas, periodo]);

  const profitByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of filteredVendas) {
      const month = format(new Date(v.dataVenda), "MMM", { locale: ptBR });
      map.set(month, (map.get(month) || 0) + Number(v.lucroBruto));
    }
    return [...map.entries()].map(([mes, lucro]) => ({ mes, lucro }));
  }, [filteredVendas]);

  const handleExportCSV = () => {
    const headers = ["Data", "Receita", "Custo", "Lucro Bruto", "Margem %"];
    const rows = filteredVendas.map((v) => [
      format(new Date(v.dataVenda), "dd/MM/yyyy", { locale: ptBR }),
      formatBRL(v.receita),
      formatBRL(v.custoTotal),
      formatBRL(v.lucroBruto),
      Number(v.receita) > 0 ? formatPercent((Number(v.lucroBruto) / Number(v.receita)) * 100) : "0%",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `fagom-shop-relatorio-${periodo}-${format(new Date(), "yyyyMMdd")}.csv`;
    link.click();
  };

  const handleExportJSON = () => {
    const data = {
      periodo,
      geradoEm: new Date().toISOString(),
      usuario: user?.name,
      kpis,
      vendas: filteredVendas.map((v) => ({
        data: v.dataVenda,
        receita: Number(v.receita),
        custo: Number(v.custoTotal),
        lucro: Number(v.lucroBruto),
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `fagom-shop-relatorio-${periodo}-${format(new Date(), "yyyyMMdd")}.json`;
    link.click();
  };

  const tooltipFormatter = (value: number) => [formatBRL(value)];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Relatórios"
        subtitle="Análise de performance comercial e exportação de dados"
        action={
          <div className="flex items-center gap-2">
            <Select
              label="Período"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as typeof periodo)}
              className="w-40"
            >
              <option value="mes">Mês atual</option>
              <option value="trimestre">Último trimestre</option>
              <option value="semestre">Último semestre</option>
              <option value="ano">Último ano</option>
            </Select>
            <Button variant="ghost" onClick={handleExportCSV}><IconDownload /> CSV</Button>
            <Button variant="ghost" onClick={handleExportJSON}><IconDownload /> JSON</Button>
            <Button variant="primary"><IconRefresh /> Atualizar</Button>
          </div>
        }
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Stat label="Receita" value={formatBRL(kpis.receita)} icon={<IconMoney />} />
            <Stat label="Custo" value={formatBRL(kpis.custo)} />
            <Stat label="Lucro" value={formatBRL(kpis.lucro)} />
            <Stat label="Margem" value={formatPercent(kpis.margem)} />
            <Stat label="Ticket médio" value={formatBRL(kpis.ticketMedio)} delta={`${kpis.count} vendas`} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <CardHeader title="Evolução mensal" subtitle={`Receita, custo e lucro (${periodo})`} />
              <div className="mt-6 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
                    <YAxis dataKey="label" type="category" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} width={60} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#23262b",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                      }}
                      formatter={tooltipFormatter}
                    />
                    <Legend />
                    <Bar dataKey="receita" name="Receita" fill="#a0a7b0" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="custo" name="Custo" fill="#8b919a" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="lucro" name="Lucro" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5">
              <CardHeader title="Distribuição de lucro" subtitle="Por mês no período" />
              <div className="mt-6 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={profitByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="lucro"
                      nameKey="mes"
                      label={({ mes, lucro }) => `${mes}: ${formatBRL(lucro)}`}
                      labelLine={false}
                    >
                      {profitByCategory.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#23262b",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                      }}
                      formatter={tooltipFormatter}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card className="mt-6 overflow-hidden">
            <CardHeader title="Detalhamento de vendas" subtitle={`${kpis.count} registro(s) no período selecionado`} />
            <div className="mt-4 overflow-x-auto">
              {filteredVendas.length === 0 ? (
                <EmptyState title="Nenhuma venda no período" hint="Ajuste o filtro de período ou cadastre vendas." />
              ) : (
                <table className="w-full text-left">
                  <thead className="sr-only sm:not-sr-only">
                    <tr>
                      <Th>Data</Th>
                      <Th>Receita</Th>
                      <Th>Custo</Th>
                      <Th>Lucro</Th>
                      <Th>Margem</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {filteredVendas
                      .sort((a, b) => new Date(b.dataVenda).getTime() - new Date(a.dataVenda).getTime())
                      .map((v) => (
                        <tr key={v.id} className="transition-colors hover:bg-black/5">
                          <Td>{formatDate(v.dataVenda)}</Td>
                          <Td className="tabular-nums text-white">{formatBRL(v.receita)}</Td>
                          <Td className="tabular-nums text-muted">{formatBRL(v.custoTotal)}</Td>
                          <Td className="tabular-nums font-semibold text-white">{formatBRL(v.lucroBruto)}</Td>
                          <Td>
                            <Badge tone={Number(v.lucroBruto) >= 0 ? "success" : "danger"}>
                              {Number(v.receita) > 0
                                ? formatPercent((Number(v.lucroBruto) / Number(v.receita)) * 100)
                                : "0%"}
                            </Badge>
                          </Td>
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