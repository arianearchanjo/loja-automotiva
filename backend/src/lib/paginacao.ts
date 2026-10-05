import { z } from "zod";

// Paginação no servidor: as listagens nunca carregam a tabela inteira, o que
// mantém o custo por query previsível conforme o histórico cresce.
export const LIMITE_MAXIMO = 100;
export const LIMITE_PADRAO = 20;

const paginacaoSchema = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(LIMITE_MAXIMO).default(LIMITE_PADRAO),
});

export type Paginacao = z.infer<typeof paginacaoSchema>;

export type Paginado<T> = {
  dados: T[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  };
};

// A query string vem do cliente: em vez de estourar com erro de validação, cai
// nos padrões (página 1, limite 20) quando o parâmetro é inválido.
export const lerPaginacao = (query: unknown): Paginacao => {
  const parsed = paginacaoSchema.safeParse(query);
  return parsed.success ? parsed.data : { pagina: 1, limite: LIMITE_PADRAO };
};

export const montarPaginado = <T>(
  dados: T[],
  total: number,
  { pagina, limite }: Paginacao,
): Paginado<T> => ({
  dados,
  paginacao: {
    pagina,
    limite,
    total,
    totalPaginas: Math.max(1, Math.ceil(total / limite)),
  },
});

export const calcularSkip = (pagina: number, limite: number) => (pagina - 1) * limite;