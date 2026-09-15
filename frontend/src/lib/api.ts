export type Calculo = {
  id: string;
  userId: string;
  nome: string;
  tipo: "direto" | "reverso";
  precoVenda: string | null;
  custoCompra: string | null;
  frete: string | null;
  taxaPlataforma: string | null;
  margemDesejada: string | null;
  resultado: string | null;
  analiseId: string | null;
  criadoEm: string;
};

export type CalculoInput = {
  nome: string;
  tipo: "direto" | "reverso";
  precoVenda?: number | string | null;
  custoCompra?: number | string | null;
  frete?: number | string | null;
  taxaPlataforma?: number | string | null;
  margemDesejada?: number | string | null;
  resultado?: number | string | null;
  analiseId?: string | null;
};

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
    const error = await res.json().catch(() => ({ error: "Erro na requisição" }));
    throw new Error(error.error || `HTTP ${res.status}`);
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
