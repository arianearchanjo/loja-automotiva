import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { calcularPrecificacao, ErroPrecificacao } from "../lib/precificacao.js";
import { requireAuth } from "../middlewares/auth.js";
import { calcularSkip, lerPaginacao, montarPaginado } from "../lib/paginacao.js";

export const calculosRouter = Router();

calculosRouter.use(requireAuth);

const percentual = z.coerce.number().min(0).max(100);
const valorMonetario = z.coerce.number().min(0);

// z.coerce.boolean() transforma a string "false" em true. Normalizamos
// explicitamente "true"/"false"/"1"/"0" e boolean real antes de validar.
const booleanOpcao = z.preprocess((valor) => {
  if (typeof valor === "boolean") return valor;
  if (typeof valor === "string") {
    const texto = valor.trim().toLowerCase();
    if (texto === "true" || texto === "1") return true;
    if (texto === "false" || texto === "0") return false;
  }
  return valor;
}, z.boolean().optional());

// Campos obrigatórios por tipo (RN07/RN12).
const obrigatoriosPorTipo = {
  direto: ["precoVenda", "custoCompra", "margemPercentual"],
  reverso: ["precoVenda", "frete", "margemPercentual"],
  vendaIdeal: ["custoCompra", "frete", "margemPercentual"],
} as const;

const calculoSchema = z.object({
  nome: z.string().min(1).max(100),
  tipo: z.enum(["direto", "reverso", "vendaIdeal"]),
  precoVenda: valorMonetario.optional(),
  custoCompra: valorMonetario.optional(),
  frete: valorMonetario.optional(),
  taxaPlataformaPercentual: percentual.optional(),
  impostoPercentual: percentual.optional(),
  descontoPlataforma: percentual.optional(),
  metaVendaAlcancada: booleanOpcao,
  margemPercentual: z.coerce.number().min(0).lt(100).optional(),
});

calculosRouter.get("/", async (req: any, res) => {
  const { pagina, limite } = lerPaginacao(req.query);
  const where = { userId: req.user.id };

  const [dados, total] = await prisma.$transaction([
    prisma.calculoPreco.findMany({
      where,
      orderBy: { criadoEm: "desc" },
      skip: calcularSkip(pagina, limite),
      take: limite,
    }),
    prisma.calculoPreco.count({ where }),
  ]);

  res.json(montarPaginado(dados, total, { pagina, limite }));
});

// Precisa vir antes de "/:id" para não ser capturada pelo parâmetro.
calculosRouter.get("/resumo", async (req: any, res) => {
  const where = { userId: req.user.id };

  const [total, agregados, porTipo] = await Promise.all([
    prisma.calculoPreco.count({ where }),
    prisma.calculoPreco.aggregate({
      where,
      _sum: { lucro: true, precoVenda: true },
      _avg: { precoVenda: true },
    }),
    prisma.calculoPreco.groupBy({ by: ["tipo"], where, _count: { _all: true } }),
  ]);

  res.json({
    total,
    lucroTotal: agregados._sum.lucro ?? 0,
    precoTotal: agregados._sum.precoVenda ?? 0,
    precoMedio: agregados._avg.precoVenda ?? 0,
    porTipo: porTipo.map((item) => ({ tipo: item.tipo, total: item._count._all })),
  });
});

calculosRouter.post("/", async (req: any, res) => {
  const parsed = calculoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }

  const { nome, tipo } = parsed.data;

  // Campos obrigatórios do tipo escolhido (RN07/RN12).
  const faltando = obrigatoriosPorTipo[tipo].filter(
    (campo) => parsed.data[campo] === undefined || parsed.data[campo] === null,
  );
  if (faltando.length > 0) {
    const fieldErrors = Object.fromEntries(
      faltando.map((campo) => [campo, ["Campo obrigatório para o tipo de cálculo escolhido"]]),
    );
    return res.status(400).json({ error: fieldErrors });
  }

  // O motor de precificação é a fonte da verdade; nenhum campo calculado
  // (taxaEfetivaPercentual, valorImposto, valorTaxa, lucro,
  // margemObtidaPercentual, resultado) vem do cliente.
  let saida;
  try {
    saida = calcularPrecificacao(parsed.data);
  } catch (erro) {
    if (erro instanceof ErroPrecificacao) {
      return res.status(400).json({ error: { tipo: [erro.message] } });
    }
    throw erro;
  }

  const calculo = await prisma.calculoPreco.create({
    data: {
      nome,
      tipo,
      precoVenda: saida.precoVenda,
      custoCompra: saida.custoCompra,
      frete: parsed.data.frete ?? null,
      taxaPlataformaPercentual: parsed.data.taxaPlataformaPercentual ?? null,
      impostoPercentual: parsed.data.impostoPercentual ?? null,
      descontoPlataforma: parsed.data.metaVendaAlcancada
        ? parsed.data.descontoPlataforma ?? null
        : null,
      metaVendaAlcancada: parsed.data.metaVendaAlcancada ?? false,
      margemPercentual: parsed.data.margemPercentual ?? null,
      taxaEfetivaPercentual: saida.taxaEfetivaPercentual,
      valorImposto: saida.valorImposto,
      valorTaxa: saida.valorTaxa,
      lucro: saida.lucro,
      margemObtidaPercentual: saida.margemObtidaPercentual,
      resultado: saida.resultado,
      userId: req.user.id,
    },
  });

  res.status(201).json(calculo);
});

calculosRouter.get("/:id", async (req: any, res) => {
  const calculo = await prisma.calculoPreco.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (!calculo) {
    return res.status(404).json({ error: "Cálculo não encontrado" });
  }

  res.json(calculo);
});

calculosRouter.delete("/:id", async (req: any, res) => {
  const calculo = await prisma.calculoPreco.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (!calculo) {
    return res.status(404).json({ error: "Cálculo não encontrado" });
  }

  await prisma.calculoPreco.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
