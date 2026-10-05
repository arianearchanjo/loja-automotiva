/* ---------------------------------------------------------------------------
 * Motor de precificação — FONTE ÚNICA DA VERDADE do cálculo de preço.
 *
 * Nenhuma outra camada (rotas, seed, frontend) deve reimplementar estas
 * fórmulas. Este módulo é puro: sem Prisma, sem Express, sem I/O.
 *
 * DECISÃO DE REGRA (ponto ambíguo resolvido com o cliente)
 * -------------------------------------------------------
 *although o primeiro relato do cliente citava "imposto: R$ 10, taxa: R$ 10",
 * ele mesmo reforçou que "a porcentagem e imposto devem ser considerados com
 * base no valor de venda, e não de custo". Adotamos: TODOS os percentuais
 * incidem sobre o PREÇO DE VENDA (V), nunca sobre o custo de compra.
 *
 * Notação
 * -------
 *   V  = preço de venda
 *   C  = custo de compra
 *   F  = frete
 *   t  = taxa da plataforma (%)
 *   d  = desconto da plataforma (%)
 *   i  = imposto (%)
 *   m  = margem de lucro desejada (%)
 *
 * Taxa efetiva (o desconto só vale quando a meta de venda foi atingida)
 * -------------------------------------------------------------------
 *   tEf = metaVendaAlcancada ? t * (1 - d / 100) : t
 *
 * Imposto e taxa são sempre calculados sobre o preço de venda:
 *   imposto = V * i   / 100
 *   taxa    = V * tEf / 100
 *
 * Modo "direto" (V conhecido → descobre o lucro)
 *   lucro        = V - C - F - imposto - taxa
 *   margemObtida = lucro / V * 100
 *
 * Modo "reverso" (V, F e m conhecidos → descobre o custo máximo de compra)
 *   custoMaximo = V - F - imposto - taxa - V * m / 100
 *
 * Modo "vendaIdeal" (C, F, t, i e m conhecidos → melhor V possível)
 * Aqui imposto e taxa são variáveis dependentes do próprio V, então isolamos V:
 *   V - C - F - V*i/100 - V*tEf/100 = V*m/100
 *   V * (1 - (i + tEf + m)/100)   = C + F
 *   V = (C + F) / (1 - (i + tEf + m)/100)
 *
 * Regras numéricas
 * ----------------
 * - "null"/"undefined" em campo numérico é tratado como 0.
 * - Se 1 - (i + tEf + m)/100 <= 0 a venda ideal é IMPOSSÍVEL: erro de
 *   negócio, nunca Infinity/NaN (RN12).
 * - Se V <= 0 o cálculo é inválido: erro de negócio.
 * - O preço de venda da venda ideal é arredondado PARA CIMA, para nunca
 *   entregar menos margem do que a pedida. Depois disso imposto, taxa, lucro
 *   e margem são recalculados a partir do V já arredondado, para que os
 *   números exibidos fechem entre si.
 * - Desconto maior que a taxa resulta em taxa efetiva 0 (nunca negativa).
 * ------------------------------------------------------------------------- */

export type TipoCalculo = "direto" | "reverso" | "vendaIdeal";

export type EntradaPrecificacao = {
  tipo: TipoCalculo;
  precoVenda?: number | null;
  custoCompra?: number | null;
  frete?: number | null;
  taxaPlataformaPercentual?: number | null;
  impostoPercentual?: number | null;
  descontoPlataforma?: number | null;
  metaVendaAlcancada?: boolean | null;
  margemPercentual?: number | null;
};

export type SaidaPrecificacao = {
  taxaEfetivaPercentual: number;
  precoVenda: number | null;
  custoCompra: number | null;
  valorImposto: number;
  valorTaxa: number;
  lucro: number;
  margemObtidaPercentual: number;
  resultado: number;
};

export type CodigoErroPrecificacao =
  | "CAMPOS_INSUFICIENTES"
  | "PERCENTUAIS_INVALIDOS"
  | "MARGEM_IMPOSSIVEL";

export class ErroPrecificacao extends Error {
  codigo: CodigoErroPrecificacao;

  constructor(codigo: CodigoErroPrecificacao, mensagem: string) {
    super(mensagem);
    this.name = "ErroPrecificacao";
    this.codigo = codigo;
  }
}

/** Converte campo numérico possivelmente nulo em número, tratando vazio como 0. */
const paraNumero = (valor: number | null | undefined): number => {
  if (valor === null || valor === undefined) return 0;
  const num = Number(valor);
  return Number.isFinite(num) ? num : 0;
};

/** Arredonda para 2 casas decimais, evitando ruído de ponto flutuante. */
const arredondar = (valor: number): number => Math.round((valor + Number.EPSILON) * 100) / 100;

/** Arredonda para 2 casas sempre para cima (usado no preço de venda da venda ideal). */
const arredondarParaCima = (valor: number): number => Math.ceil((valor - Number.EPSILON) * 100) / 100;

/** Percentuais aceitos vão de 0 a 100; fora disso é erro de negócio. */
const validarPercentual = (nome: string, valor: number): void => {
  if (valor < 0 || valor > 100) {
    throw new ErroPrecificacao(
      "PERCENTUAIS_INVALIDOS",
      "Os percentuais informados devem ficar entre 0 e 100.",
    );
  }
};

/**
 * Taxa efetiva da plataforma: aplica o desconto somente quando a meta de
 * venda foi atingida. Um desconto maior que a taxa resulta em taxa efetiva 0,
 * nunca negativa (a plataforma não "paga" taxa ao vendedor).
 */
export function calcularTaxaEfetiva(
  taxaPlataformaPercentual: number | null | undefined,
  descontoPlataforma: number | null | undefined,
  metaVendaAlcancada: boolean | null | undefined,
): number {
  const taxa = paraNumero(taxaPlataformaPercentual);

  if (!metaVendaAlcancada) return arredondar(taxa);

  const desconto = paraNumero(descontoPlataforma);
  const taxaEfetiva = taxa * (1 - desconto / 100);

  return arredondar(taxaEfetiva > 0 ? taxaEfetiva : 0);
}

export function calcularPrecificacao(entrada: EntradaPrecificacao): SaidaPrecificacao {
  const precoVendaInformado = paraNumero(entrada.precoVenda);
  const custoCompra = paraNumero(entrada.custoCompra);
  const frete = paraNumero(entrada.frete);
  const taxa = paraNumero(entrada.taxaPlataformaPercentual);
  const impostoPercentual = paraNumero(entrada.impostoPercentual);
  const desconto = paraNumero(entrada.descontoPlataforma);
  const margem = paraNumero(entrada.margemPercentual);

  validarPercentual("taxaPlataformaPercentual", taxa);
  validarPercentual("impostoPercentual", impostoPercentual);
  validarPercentual("descontoPlataforma", desconto);
  validarPercentual("margemPercentual", margem);

  // --- Campos obrigatórios por tipo -------------------------------------
  if (entrada.tipo === "direto") {
    if (entrada.precoVenda === null || entrada.precoVenda === undefined) {
      throw new ErroPrecificacao(
        "CAMPOS_INSUFICIENTES",
        "Informe o preço de venda para calcular o lucro.",
      );
    }
    if (entrada.custoCompra === null || entrada.custoCompra === undefined) {
      throw new ErroPrecificacao(
        "CAMPOS_INSUFICIENTES",
        "Informe o custo de compra para calcular o lucro.",
      );
    }
    if (entrada.margemPercentual === null || entrada.margemPercentual === undefined) {
      throw new ErroPrecificacao(
        "CAMPOS_INSUFICIENTES",
        "Informe a margem desejada para o cálculo direto.",
      );
    }
  }

  if (entrada.tipo === "reverso") {
    if (entrada.precoVenda === null || entrada.precoVenda === undefined) {
      throw new ErroPrecificacao(
        "CAMPOS_INSUFICIENTES",
        "Informe o preço de venda alvo para calcular o custo máximo.",
      );
    }
    if (entrada.frete === null || entrada.frete === undefined) {
      throw new ErroPrecificacao(
        "CAMPOS_INSUFICIENTES",
        "Informe o frete para calcular o custo máximo.",
      );
    }
    if (entrada.margemPercentual === null || entrada.margemPercentual === undefined) {
      throw new ErroPrecificacao(
        "CAMPOS_INSUFICIENTES",
        "Informe a margem desejada para o cálculo reverso.",
      );
    }
  }

  if (entrada.tipo === "vendaIdeal") {
    if (entrada.custoCompra === null || entrada.custoCompra === undefined) {
      throw new ErroPrecificacao(
        "CAMPOS_INSUFICIENTES",
        "Informe o custo de compra para calcular o preço de venda ideal.",
      );
    }
    if (entrada.frete === null || entrada.frete === undefined) {
      throw new ErroPrecificacao(
        "CAMPOS_INSUFICIENTES",
        "Informe o frete para calcular o preço de venda ideal.",
      );
    }
    if (entrada.margemPercentual === null || entrada.margemPercentual === undefined) {
      throw new ErroPrecificacao(
        "CAMPOS_INSUFICIENTES",
        "Informe a margem de lucro desejada para calcular o preço de venda ideal.",
      );
    }
  }

  // --- Taxa efetiva (o desconto só vale com meta atingida) ---------------
  const taxaEfetivaPercentual = calcularTaxaEfetiva(
    taxa,
    desconto,
    entrada.metaVendaAlcancada,
  );

  // --- Modo "direto": V conhecido → descobre o lucro ----------------------
  if (entrada.tipo === "direto") {
    if (precoVendaInformado <= 0) {
      throw new ErroPrecificacao(
        "PERCENTUAIS_INVALIDOS",
        "O preço de venda deve ser maior que zero.",
      );
    }

    const valorImposto = arredondar((precoVendaInformado * impostoPercentual) / 100);
    const valorTaxa = arredondar((precoVendaInformado * taxaEfetivaPercentual) / 100);
    const lucro = arredondar(precoVendaInformado - custoCompra - frete - valorImposto - valorTaxa);
    const margemObtidaPercentual = arredondar((lucro / precoVendaInformado) * 100);

    return {
      taxaEfetivaPercentual,
      precoVenda: arredondar(precoVendaInformado),
      custoCompra: arredondar(custoCompra),
      valorImposto,
      valorTaxa,
      lucro,
      margemObtidaPercentual,
      resultado: lucro,
    };
  }

  // --- Modo "reverso": V, F e m conhecidos → descobre custo máximo -------
  if (entrada.tipo === "reverso") {
    if (precoVendaInformado <= 0) {
      throw new ErroPrecificacao(
        "PERCENTUAIS_INVALIDOS",
        "O preço de venda deve ser maior que zero.",
      );
    }

    const valorImposto = arredondar((precoVendaInformado * impostoPercentual) / 100);
    const valorTaxa = arredondar((precoVendaInformado * taxaEfetivaPercentual) / 100);
    const margemDesejadaValor = arredondar((precoVendaInformado * margem) / 100);
    const custoMaximo = arredondar(
      precoVendaInformado - frete - valorImposto - valorTaxa - margemDesejadaValor,
    );

    if (custoMaximo <= 0) {
      throw new ErroPrecificacao(
        "MARGEM_IMPOSSIVEL",
        "Com esses percentuais e frete não sobra valor para o custo do produto.",
      );
    }

    // O lucro e a margem são os que a margem desejada garante sobre esse custo.
    const lucro = arredondar(precoVendaInformado - custoMaximo - frete - valorImposto - valorTaxa);
    const margemObtidaPercentual = arredondar((lucro / precoVendaInformado) * 100);

    return {
      taxaEfetivaPercentual,
      precoVenda: arredondar(precoVendaInformado),
      custoCompra: custoMaximo,
      valorImposto,
      valorTaxa,
      lucro,
      margemObtidaPercentual,
      resultado: custoMaximo,
    };
  }

  // --- Modo "vendaIdeal": C, F, t, i e m conhecidos → melhor V ----------
  const somaPercentuais = impostoPercentual + taxaEfetivaPercentual + margem;

  if (somaPercentuais >= 100) {
    throw new ErroPrecificacao(
      "MARGEM_IMPOSSIVEL",
      "Imposto, taxa da plataforma e margem somam 100% ou mais: não existe preço de venda possível.",
    );
  }

  const precoVendaBruto = (custoCompra + frete) / (1 - somaPercentuais / 100);

  if (!Number.isFinite(precoVendaBruto) || precoVendaBruto <= 0) {
    throw new ErroPrecificacao(
      "PERCENTUAIS_INVALIDOS",
      "O preço de venda calculado é inválido. Revise custo, frete e percentuais.",
    );
  }

  // Arredonda para cima para nunca entregar menos margem que a pedida e
  // recalcula os derivados a partir do preço já arredondado.
  const precoVenda = arredondarParaCima(precoVendaBruto);
  const valorImposto = arredondar((precoVenda * impostoPercentual) / 100);
  const valorTaxa = arredondar((precoVenda * taxaEfetivaPercentual) / 100);
  const lucro = arredondar(precoVenda - custoCompra - frete - valorImposto - valorTaxa);
  const margemObtidaPercentual = arredondar((lucro / precoVenda) * 100);

  return {
    taxaEfetivaPercentual,
    precoVenda,
    custoCompra: arredondar(custoCompra),
    valorImposto,
    valorTaxa,
    lucro,
    margemObtidaPercentual,
    resultado: precoVenda,
  };
}