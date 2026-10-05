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
  list: () => api<Calculo[]>("/api/calculos"),
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
  list: () => api<Venda[]>("/api/vendas"),
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
  list: () => api<Analise[]>("/api/analises"),
  get: (id: string) => api<Analise>(`/api/analises/${id}`),
  create: (data: { periodoInicio: string; periodoFim: string }) =>
    api<Analise>("/api/analises", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    api<void>(`/api/analises/${id}`, { method: "DELETE" }),
};
