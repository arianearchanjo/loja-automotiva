import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  calculosApi,
  type Calculo,
  type CalculosResumo,
  type PaginacaoInfo,
} from "../lib/api";
import { Badge, Button, Card, CardHeader, EmptyState, PageHeader, Paginacao, Td, Th, Stat } from "../components/ui";
import { formatBRL, formatDateTime, formatPercent } from "../lib/format";

type TipoCalculo = "direto" | "reverso" | "vendaIdeal";

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

function IconMais() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function IconCalculadora() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h.01M13 12h.01M9 16h.01M13 16h.01" strokeLinecap="round" />
    </svg>
  );
}

function IconDinheiro() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" strokeLinecap="round" />
    </svg>
  );
}

function IconGrafico() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" />
    </svg>
  );
}

const PAGINA_INICIAL = 1;
const LIMITE_INICIAL = 20;

export default function Calculos() {
  const navigate = useNavigate();
  const [calculos, setCalculos] = useState<Calculo[]>([]);
  const [resumo, setResumo] = useState<CalculosResumo | null>(null);
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [paginado, resumoTotal] = await Promise.all([
        calculosApi.list({ pagina, limite }),
        calculosApi.resumo(),
      ]);
      setCalculos(paginado.dados);
      setInfo(paginado.paginacao);
      setResumo(resumoTotal);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [pagina, limite]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este cálculo?")) return;
    try {
      await calculosApi.delete(id);
      // Se a página ficou vazia, volta uma página em vez de mostrar tabela em branco.
      if (calculos.length === 1 && pagina > 1) setPagina(pagina - 1);
      else load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir");
    }
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Cálculos de Preço"
        subtitle="Histórico de todos os cálculos salvos, do mais recente para o mais antigo."
        action={
          <Button onClick={() => navigate("/calculos/novo")}>
            <IconMais />
            Novo cálculo
          </Button>
        }
      />

      {error && (
        <div className="mb-6 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger animate-fade-in">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Stat
          label="Cálculos"
          value={String(resumo?.total ?? info.total)}
          icon={<IconCalculadora />}
        />
        <Stat
          label="Lucro acumulado"
          value={formatBRL(resumo?.lucroTotal ?? 0)}
          icon={<IconDinheiro />}
        />
        <Stat
          label="Preço médio"
          value={formatBRL(resumo?.precoMedio ?? 0)}
          icon={<IconGrafico />}
        />
      </div>

      <Card className="overflow-hidden">
        <CardHeader
          title="Histórico de cálculos"
          subtitle={`${info.total} cálculo(s) salvo(s)`}
        />
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
            <EmptyState
              title="Nenhum cálculo ainda"
              hint="Crie seu primeiro cálculo para ver ele listado aqui."
            />
          ) : (
            <table className="w-full text-left">
              <thead className="sr-only md:not-sr-only">
                <tr>
                  <Th>Nome</Th>
                  <Th>Tipo</Th>
                  <Th>Preço de venda</Th>
                  <Th>Custo</Th>
                  <Th>Frete</Th>
                  <Th>Taxa (%)</Th>
                  <Th>Imposto (%)</Th>
                  <Th>Lucro</Th>
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
                    <Td className="tabular-nums font-bold text-success">{formatBRL(c.precoVenda)}</Td>
                    <Td className="tabular-nums text-muted">{formatBRL(c.custoCompra)}</Td>
                    <Td className="tabular-nums text-muted">{formatBRL(c.frete)}</Td>
                    <Td className="tabular-nums text-muted">
                      {formatPercent(c.taxaEfetivaPercentual ?? c.taxaPlataformaPercentual, 2)}
                    </Td>
                    <Td className="tabular-nums text-muted">{formatPercent(c.impostoPercentual, 2)}</Td>
                    <Td className="tabular-nums font-medium text-primary">
                      {formatBRL(c.lucro ?? c.resultado)}
                    </Td>
                    <Td className="tabular-nums text-muted">
                      {formatPercent(c.margemObtidaPercentual ?? c.margemPercentual, 2)}
                    </Td>
                    <Td className="text-muted">{formatDateTime(c.criadoEm)}</Td>
                    <Td className="text-right">
                      <Button
                        variant="danger"
                        className="px-3 py-1.5 text-xs"
                        onClick={() => handleDelete(c.id)}
                      >
                        Excluir
                      </Button>
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
    </div>
  );
}
