import { describe, expect, it } from "vitest";
import {
  calcularPrecificacao,
  calcularTaxaEfetiva,
  ErroPrecificacao,
} from "./precificacao.js";

/** Garante que nenhum número seja propagado para a tela como NaN/Infinity (RN12). */
const semNaoNumero = (saida: Record<string, unknown>) => {
  for (const valor of Object.values(saida)) {
    expect(typeof valor === "number" ? Number.isFinite(valor) : true).toBe(true);
  }
};

describe("precificacao — vetores de referência", () => {
  it("Caso A: vendaIdeal sem desconto (exemplo do cliente)", () => {
    const saida = calcularPrecificacao({
      tipo: "vendaIdeal",
      custoCompra: 100,
      frete: 15,
      taxaPlataformaPercentual: 10,
      impostoPercentual: 10,
      margemPercentual: 5,
      descontoPlataforma: 0,
      metaVendaAlcancada: false,
    });

    expect(saida.precoVenda).toBe(153.34);
    expect(saida.valorImposto).toBe(15.33);
    expect(saida.valorTaxa).toBe(15.33);
    expect(saida.lucro).toBe(7.68);
    expect(saida.margemObtidaPercentual).toBeCloseTo(5.01, 2);
    expect(saida.resultado).toBe(153.34);
    semNaoNumero(saida as unknown as Record<string, unknown>);
  });

  it("Caso B: vendaIdeal com meta atingida e desconto de 20%", () => {
    const saida = calcularPrecificacao({
      tipo: "vendaIdeal",
      custoCompra: 100,
      frete: 15,
      taxaPlataformaPercentual: 10,
      impostoPercentual: 10,
      margemPercentual: 5,
      descontoPlataforma: 20,
      metaVendaAlcancada: true,
    });

    expect(saida.taxaEfetivaPercentual).toBe(8);
    expect(saida.precoVenda).toBe(149.36);
    expect(saida.valorImposto).toBe(14.94);
    expect(saida.valorTaxa).toBe(11.95);
    expect(saida.lucro).toBe(7.47);
    expect(saida.margemObtidaPercentual).toBeCloseTo(5.0, 2);
    expect(saida.resultado).toBe(149.36);
    semNaoNumero(saida as unknown as Record<string, unknown>);
  });

  it("Caso C: desconto é ignorado quando a meta não foi atingida", () => {
    const comMeta = calcularPrecificacao({
      tipo: "vendaIdeal",
      custoCompra: 100,
      frete: 15,
      taxaPlataformaPercentual: 10,
      impostoPercentual: 10,
      margemPercentual: 5,
      descontoPlataforma: 20,
      metaVendaAlcancada: false,
    });

    const semDesconto = calcularPrecificacao({
      tipo: "vendaIdeal",
      custoCompra: 100,
      frete: 15,
      taxaPlataformaPercentual: 10,
      impostoPercentual: 10,
      margemPercentual: 5,
      descontoPlataforma: 0,
      metaVendaAlcancada: false,
    });

    expect(comMeta).toEqual(semDesconto);
    expect(comMeta.precoVenda).toBe(153.34);
    semNaoNumero(comMeta as unknown as Record<string, unknown>);
  });

  it("Caso D: direto com percentuais sobre o preço de venda", () => {
    const saida = calcularPrecificacao({
      tipo: "direto",
      precoVenda: 420,
      custoCompra: 280,
      frete: 25,
      taxaPlataformaPercentual: 12,
      impostoPercentual: 8,
      margemPercentual: 15,
    });

    expect(saida.valorImposto).toBe(33.6);
    expect(saida.valorTaxa).toBe(50.4);
    expect(saida.lucro).toBe(31);
    expect(saida.margemObtidaPercentual).toBeCloseTo(7.38, 2);
    expect(saida.resultado).toBe(31);
    semNaoNumero(saida as unknown as Record<string, unknown>);
  });

  it("Caso E: reverso descobre o custo máximo de compra", () => {
    const saida = calcularPrecificacao({
      tipo: "reverso",
      precoVenda: 620,
      frete: 35,
      taxaPlataformaPercentual: 11,
      impostoPercentual: 12,
      margemPercentual: 20,
    });

    expect(saida.valorImposto).toBe(74.4);
    expect(saida.valorTaxa).toBe(68.2);
    expect(saida.custoCompra).toBe(318.4);
    expect(saida.resultado).toBe(318.4);
    semNaoNumero(saida as unknown as Record<string, unknown>);
  });

  it("Caso F: percentuais somando 100% ou mais é impossível", () => {
    expect(() =>
      calcularPrecificacao({
        tipo: "vendaIdeal",
        custoCompra: 100,
        frete: 15,
        taxaPlataformaPercentual: 60,
        impostoPercentual: 30,
        margemPercentual: 20,
      }),
    ).toThrowError(ErroPrecificacao);

    try {
      calcularPrecificacao({
        tipo: "vendaIdeal",
        custoCompra: 100,
        frete: 15,
        taxaPlataformaPercentual: 60,
        impostoPercentual: 30,
        margemPercentual: 20,
      });
    } catch (erro) {
      expect((erro as ErroPrecificacao).codigo).toBe("MARGEM_IMPOSSIVEL");
    }
  });

  it("Caso G: vendaIdeal sem frete retorna CAMPOS_INSUFICIENTES", () => {
    try {
      calcularPrecificacao({
        tipo: "vendaIdeal",
        custoCompra: 100,
        margemPercentual: 5,
      });
      expect.unreachable("deveria lançar ErroPrecificacao");
    } catch (erro) {
      expect(erro).toBeInstanceOf(ErroPrecificacao);
      expect((erro as ErroPrecificacao).codigo).toBe("CAMPOS_INSUFICIENTES");
    }
  });

  it("Caso H: taxa efetiva nunca fica negativa ao aplicar o desconto", () => {
    // Desconto é relativo (t * (1 - d/100)), como prova o Caso B (10% e 20% -> 8%).
    // Com taxa 5% e desconto 20% a taxa efetiva é 4%, ainda positiva.
    expect(calcularTaxaEfetiva(5, 20, true)).toBe(4);

    // O piso em 0 só é alcançável com desconto total (100%), nunca negativo.
    const taxaEfetivaTotal = calcularTaxaEfetiva(5, 100, true);
    expect(taxaEfetivaTotal).toBe(0);
    expect(taxaEfetivaTotal).not.toBeLessThan(0);
    expect(Number.isFinite(taxaEfetivaTotal)).toBe(true);
  });

  it("Caso I: percentual fora de 0 a 100 é inválido", () => {
    try {
      calcularPrecificacao({
        tipo: "vendaIdeal",
        custoCompra: 100,
        frete: 15,
        impostoPercentual: 150,
        margemPercentual: 5,
      });
      expect.unreachable("deveria lançar ErroPrecificacao");
    } catch (erro) {
      expect((erro as ErroPrecificacao).codigo).toBe("PERCENTUAIS_INVALIDOS");
    }
  });

  it("Caso J: nulos e ausentes se comportam como zero", () => {
    const saida = calcularPrecificacao({
      tipo: "vendaIdeal",
      custoCompra: 100,
      frete: 15,
      taxaPlataformaPercentual: 10,
      impostoPercentual: null,
      descontoPlataforma: null,
      metaVendaAlcancada: null,
      margemPercentual: 5,
    });

    expect(saida.valorImposto).toBe(0);
    expect(saida.taxaEfetivaPercentual).toBe(10);
    expect(Number.isFinite(saida.precoVenda ?? NaN)).toBe(true);
    semNaoNumero(saida as unknown as Record<string, unknown>);
  });
});

describe("precificacao — regras adicionais", () => {
  it("não aplica desconto quando metaVendaAlcancada é falsy", () => {
    expect(calcularTaxaEfetiva(10, 20, false)).toBe(10);
    expect(calcularTaxaEfetiva(10, 20, undefined)).toBe(10);
    expect(calcularTaxaEfetiva(10, 20, null)).toBe(10);
    expect(calcularTaxaEfetiva(10, 20, true)).toBe(8);
  });

  it("rejeita preço de venda não positivo no cálculo direto", () => {
    expect(() =>
      calcularPrecificacao({
        tipo: "direto",
        precoVenda: 0,
        custoCompra: 100,
        margemPercentual: 10,
      }),
    ).toThrowError(ErroPrecificacao);
  });

  it("exige os campos do cálculo reverso", () => {
    try {
      calcularPrecificacao({ tipo: "reverso", precoVenda: 620, margemPercentual: 20 });
      expect.unreachable("deveria lançar ErroPrecificacao");
    } catch (erro) {
      expect((erro as ErroPrecificacao).codigo).toBe("CAMPOS_INSUFICIENTES");
    }
  });
});