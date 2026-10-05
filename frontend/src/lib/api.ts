// Campos vindos do Prisma (Decimal) chegam como string; campos vindos do
// endpoint de simulação chegam como number.
export type Calculo = {
  id: string;
  userId: string;
  nome: string;
  tipo: "direto" | "reverso" | "vendaIdeal";
  precoVenda: string | null;
  custoCompra: string | null;
  frete: string | null;
  taxaPlataformaPercentual: string | null;
  impostoPercentual: string | null;
  descontoPlataforma: string | null;
  metaVendaAlcancada: boolean;
  margemPercentual: string | null;
  taxaEfetivaPercentual: string | null;
  valorImposto: string | null;
  valorTaxa: string | null;
  lucro: string | null;
  margemObtidaPercentual: string | null;
  resultado: string | null;
  analiseId: string | null;
  criadoEm: string;
};

// Sem campos de resultado: o cliente nunca envia os derivados, o backend calcula.
export type CalculoInput = {
  nome: string;
  tipo: "direto" | "reverso" | "vendaIdeal";
  precoVenda?: number | null;
  custoCompra?: number | null;
  frete?: number | null;
  taxaPlataformaPercentual?: number | null;
  impostoPercentual?: number | null;
  descontoPlataforma?: number | null;
  metaVendaAlcancada?: boolean | null;
  margemPercentual?: number | null;
};

export type SimulacaoResultado = {
  taxaEfetivaPercentual: number;
  precoVenda: number | null;
  custoCompra: number | null;
  valorImposto: number;
  valorTaxa: number;
  lucro: number;
  margemObtidaPercentual: number;
  resultado: number;
};

export type SimulacaoInput = Omit<CalculoInput, "nome">;

export type Venda = {
  id: string;
  userId: string;
  receita: string;
  custoTotal: string;
  lucroBruto: string;
  dataVenda: string;
  criadoEm: string;
};

export type VendaInput = {
  receita: number | string;
  custoTotal: number | string;
  dataVenda: string;
};

export type Analise = {
  id: string;
  userId: string;
  periodoInicio: string;
  periodoFim: string;
  receitaTotal: string;
  custoTotal: string;
  lucroTotal: string;
  criadoEm: string;
  atualizadoEm: string;
};

export type PaginacaoInfo = {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
};

export type Paginado<T> = { dados: T[]; paginacao: PaginacaoInfo };

export type FiltroPeriodo = { periodoInicio?: string; periodoFim?: string };

export type ListParams = FiltroPeriodo & { pagina?: number; limite?: number };

export type CalculosResumo = {
  total: number;
  lucroTotal: string | number;
  precoTotal: string | number;
  precoMedio: string | number;
  porTipo: { tipo: Calculo["tipo"]; total: number }[];
};

export type VendasResumo = {
  quantidade: number;
  receita: number;
  custo: number;
  lucro: number;
  margem: number;
  ticketMedio: number;
  porMes: { mes: string; receita: number; custo: number; lucro: number }[];
};

// Serializa apenas os parâmetros preenchidos, para não mandar "pagina=undefined".
const comQuery = (
  path: string,
  params?: Record<string, string | number | undefined>,
): string => {
  if (!params) return path;
  const busca = new URLSearchParams();
  for (const [chave, valor] of Object.entries(params)) {
    if (valor === undefined || valor === null || valor === "") continue;
    busca.set(chave, String(valor));
  }
  const query = busca.toString();
  return query ? `${path}?${query}` : path;
};

// O backend pode responder com "error" como string (erro de negócio) ou como
// objeto de fieldErrors (Zod). Extrair a mensagem aqui evita mostrar
// "[object Object]" na tela (RN61).
const extrairMensagemErro = (error: unknown): string | null => {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const campo = Object.values(error as Record<string, unknown>).find(
      (valor) => Array.isArray(valor) || typeof valor === "string",
    );
    if (typeof campo === "string") return campo;
    if (Array.isArray(campo) && typeof campo[0] === "string") return campo[0];
  }
  return null;
};

const api = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include",
  });

  if (!res.ok) {
    const corpo = await res.json().catch(() => null);
    const mensagem = corpo ? extrairMensagemErro(corpo.error) : null;
    throw new Error(mensagem ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
};

export const calculosApi = {
  list: (params?: ListParams) => api<Paginado<Calculo>>(comQuery("/api/calculos", params)),
  // Totais agregados no banco: os cards não dependem da página carregada.
  resumo: () => api<CalculosResumo>("/api/calculos/resumo"),
  get: (id: string) => api<Calculo>(`/api/calculos/${id}`),
  create: (data: CalculoInput) =>
    api<Calculo>("/api/calculos", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    api<void>(`/api/calculos/${id}`, { method: "DELETE" }),
  // Simula sem gravar: o backend é a fonte da verdade do cálculo.
  simular: (data: SimulacaoInput) =>
    api<SimulacaoResultado>("/api/simulacoes/preco", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const vendasApi = {
  list: (params?: ListParams) => api<Paginado<Venda>>(comQuery("/api/vendas", params)),
  resumo: (params?: FiltroPeriodo) =>
    api<VendasResumo>(comQuery("/api/vendas/resumo", params)),
  // Download direto: o arquivo é montado no servidor (Content-Disposition),
  // sem passar todas as vendas pelo navegador.
  exportarUrl: (formato: "csv" | "json", params?: FiltroPeriodo) =>
    comQuery("/api/vendas/exportar", { formato, ...params }),
  get: (id: string) => api<Venda>(`/api/vendas/${id}`),
  create: (data: VendaInput) =>
    api<Venda>("/api/vendas", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    api<void>(`/api/vendas/${id}`, { method: "DELETE" }),
};

export const analisesApi = {
  list: (params?: ListParams) =>
    api<Paginado<Analise>>(comQuery("/api/analises", params)),
  get: (id: string) => api<Analise>(`/api/analises/${id}`),
  create: (data: { periodoInicio: string; periodoFim: string }) =>
    api<Analise>("/api/analises", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    api<void>(`/api/analises/${id}`, { method: "DELETE" }),
};
