export type EntradasCalculoPreco = {
  custo: number;
  frete: number;
  taxa: number;
  imposto: number;
  margem: number;
};

export type ComponenteDetalhamento = {
  rotulo: string;
  valor: number;
};

export type ResultadoCalculoPreco = {
  precoVenda: number;
  custo: number;
  frete: number;
  taxa: number;
  imposto: number;
  margem: number;
  taxaValor: number;
  impostoValor: number;
  margemValor: number;
  detalhamento: ComponenteDetalhamento[];
};

export type DescontoTaxa = {
  aplica: boolean;
  percentual: number;
};

const CENTO = 100;

export function calcularDescontoTaxa(
  metaVendas: number,
  vendasAcumuladas: number,
  descontoPercentual: number,
): DescontoTaxa {
  const percentual = metaVendas > 0 && vendasAcumuladas >= metaVendas ? descontoPercentual : 0;
  return { aplica: percentual > 0, percentual };
}

export function calcularTaxaEfetiva(taxa: number, desconto: DescontoTaxa): number {
  if (!desconto.aplica) return taxa;
  const efetiva = taxa * (1 - desconto.percentual / CENTO);
  return efetiva < 0 ? 0 : efetiva;
}

export function calcularPrecoVenda(entradas: EntradasCalculoPreco): ResultadoCalculoPreco | null {
  const { custo, frete } = entradas;
  const taxa = entradas.taxa / CENTO;
  const imposto = entradas.imposto / CENTO;
  const margem = entradas.margem / CENTO;

  if (custo + frete <= 0) return null;

  const denominador = 1 - taxa - imposto - margem;
  if (denominador <= 0) return null;

  const precoVenda = (custo + frete) / denominador;
  const taxaValor = precoVenda * taxa;
  const impostoValor = precoVenda * imposto;
  const margemValor = precoVenda * margem;

  const pct = (valor: number) => `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;

  return {
    precoVenda,
    custo,
    frete,
    taxa: entradas.taxa,
    imposto: entradas.imposto,
    margem: entradas.margem,
    taxaValor,
    impostoValor,
    margemValor,
    detalhamento: [
      { rotulo: "Custo", valor: custo },
      { rotulo: "Frete", valor: frete },
      { rotulo: `Taxa ${pct(entradas.taxa)}`, valor: taxaValor },
      { rotulo: `Imposto ${pct(entradas.imposto)}`, valor: impostoValor },
      { rotulo: `Lucro ${pct(entradas.margem)}`, valor: margemValor },
      { rotulo: "Venda", valor: precoVenda },
    ],
  };
}
