import { useCallback, useEffect, useMemo, useState } from "react";
import {
  vendasApi,
  type FiltroPeriodo,
  type PaginacaoInfo,
  type Venda,
  type VendasResumo,
} from "../lib/api";
import { useAuth } from "../lib/auth";
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  Select,
  Paginacao,
  Td,
  Th,
  Button,
  Stat,
} from "../components/ui";
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

const PAGINA_INICIAL = 1;
const LIMITE_INICIAL = 10;

type Periodo = "mes" | "trimestre" | "semestre" | "ano";

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

// O período é enviado ao servidor, que filtra e agrega no banco. O fim do
// período vai até 23:59:59 para não excluir vendas do próprio dia.
const filtroDoPeriodo = (periodo: Periodo): FiltroPeriodo => {
  const agora = new Date();
  const meses = periodo === "mes" ? 1 : periodo === "trimestre" ? 3 : periodo === "semestre" ? 6 : 12;
  const inicio = startOfMonth(subMonths(agora, meses - 1));
  const fim = new Date(agora);
  fim.setHours(23, 59, 59, 999);
  return {
    periodoInicio: inicio.toISOString(),
    periodoFim: fim.toISOString(),
  };
};

export default function Relatorios() {
  const { user } = useAuth();
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [resumo, setResumo] = useState<VendasResumo | null>(null);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [pagina, setPagina] = useState(PAGINA_INICIAL);
  const [limite, setLimite] = useState(LIMITE_INICIAL);
  const [info, setInfo] = useState<PaginacaoInfo>({
    pagina: PAGINA_INICIAL,
    limite: LIMITE_INICIAL,
    total: 0,
    totalPaginas: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const filtro = useMemo(() => filtroDoPeriodo(periodo), [periodo]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // KPIs e séries vêm agregados do banco; a tabela pede só a página atual.
      const [resumoTotal, paginaVendas] = await Promise.all([
        vendasApi.resumo(filtro),
        vendasApi.list({ ...filtro, pagina, limite }),
      ]);
      setResumo(resumoTotal);
      setVendas(paginaVendas.dados);
      setInfo(paginaVendas.paginacao);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [filtro, pagina, limite]);

  useEffect(() => {
    load();
  }, [load]);

  const kpis = useMemo(
    () => ({
      receita: resumo?.receita ?? 0,
      custo: resumo?.custo ?? 0,
      lucro: resumo?.lucro ?? 0,
      margem: resumo?.margem ?? 0,
      ticketMedio: resumo?.ticketMedio ?? 0,
      count: resumo?.quantidade ?? 0,
    }),
    [resumo],
  );

  // Preenche meses sem venda para o gráfico não virar uma linha solta.
  const monthlyData = useMemo(() => {
    const meses = periodo === "mes" ? 1 : periodo === "trimestre" ? 3 : periodo === "semestre" ? 6 : 12;
    const mapa = new Map<string, { receita: number; custo: number; lucro: number; label: string }>();
    const agora = new Date();
    for (let i = meses - 1; i >= 0; i--) {
      const d = startOfMonth(subMonths(agora, i));
      const key = format(d, "yyyy-MM");
      mapa.set(key, {
        receita: 0,
        custo: 0,
        lucro: 0,
        label: format(d, "MMM/yy", { locale: ptBR }),
      });
    }
    for (const linha of resumo?.porMes ?? []) {
      const entrada = mapa.get(linha.mes);
      if (entrada) {
        entrada.receita = linha.receita;
        entrada.custo = linha.custo;
        entrada.lucro = linha.lucro;
      }
    }
    return [...mapa.values()];
  }, [resumo, periodo]);

  const profitByCategory = useMemo(
    () =>
      (resumo?.porMes ?? []).map((linha) => ({
        mes: format(new Date(`${linha.mes}-01T00:00:00`), "MMM", { locale: ptBR }),
        lucro: linha.lucro,
      })),
    [resumo],
  );

  // O arquivo é montado no servidor e baixado direto pelo navegador.
  const handleExport = (formato: "csv" | "json") => {
    window.location.href = vendasApi.exportarUrl(formato, filtro);
  };

  const tooltipFormatter = (value: unknown) => [formatBRL(Number(value))];

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
              onChange={(e) => setPeriodo(e.target.value as Periodo)}
              className="w-40"
            >
              <option value="mes">Mês atual</option>
              <option value="trimestre">Último trimestre</option>
              <option value="semestre">Último semestre</option>
              <option value="ano">Último ano</option>
            </Select>
            <Button variant="ghost" onClick={() => handleExport("csv")}>
              <IconDownload /> CSV
            </Button>
            <Button variant="ghost" onClick={() => handleExport("json")}>
              <IconDownload /> JSON
            </Button>
            <Button onClick={load} disabled={loading}>
              <IconRefresh /> Atualizar
            </Button>
          </div>
        }
      />

      {error && (
        <div className="mb-6 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {loading && !resumo ? (
        <p className="text-muted">Carregando dados...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Stat label="Receita" value={formatBRL(kpis.receita)} icon={<IconMoney />} />
            <Stat label="Custo" value={formatBRL(kpis.custo)} />
            <Stat label="Lucro" value={formatBRL(kpis.lucro)} />
            <Stat label="Margem" value={formatPercent(kpis.margem)} />
            <Stat
              label="Ticket médio"
              value={formatBRL(kpis.ticketMedio)}
              delta={`${kpis.count} vendas`}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <CardHeader title="Evolução mensal" subtitle={`Receita, custo e lucro (${periodo})`} />
              <div className="mt-6 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis
                      type="number"
                      stroke="rgba(255,255,255,0.4)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                    />
                    <YAxis
                      dataKey="label"
                      type="category"
                      stroke="rgba(255,255,255,0.4)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      width={60}
                    />
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
                      label={(props: unknown) => {
                        const { mes, lucro } = props as { mes?: string; lucro?: number };
                        return `${mes ?? ""}: ${formatBRL(Number(lucro))}`;
                      }}
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
            <CardHeader
              title="Detalhamento de vendas"
              subtitle={`${kpis.count} registro(s) no período selecionado`}
            />
            <div className="mt-4 overflow-x-auto">
              {vendas.length === 0 ? (
                <EmptyState
                  title="Nenhuma venda no período"
                  hint="Ajuste o filtro de período ou cadastre vendas."
                />
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
                    {vendas.map((v) => (
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

            <Paginacao
              pagina={info.pagina}
              totalPaginas={info.totalPaginas}
              total={info.total}
              limite={info.limite}
              carregando={loading}
              onPagina={setPagina}
              onLimite={(novo) => {
                setLimite(novo);
                setPagina(PAGINA_INICIAL);
              }}
            />
          </Card>

          <p className="mt-4 text-xs text-muted">
            Exportação gerada por {user?.name ?? "usuário"} em {format(new Date(), "dd/MM/yyyy HH:mm")}
            , contendo todas as vendas do período selecionado.
          </p>
        </>
      )}
    </div>
  );
}