import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middlewares/auth.js";
import { calcularSkip, lerPaginacao, montarPaginado } from "../lib/paginacao.js";

export const vendasRouter = Router();

vendasRouter.use(requireAuth);

const vendaSchema = z.object({
  receita: z.coerce.number(),
  custoTotal: z.coerce.number(),
  dataVenda: z.coerce.date(),
});

const periodoSchema = z.object({
  periodoInicio: z.coerce.date().optional(),
  periodoFim: z.coerce.date().optional(),
});

// Mesmo esquema nos filtros de listagem, resumo e exportação: o período é
// aplicado no banco, e não no navegador.
const lerPeriodo = (query: unknown) => {
  const parsed = periodoSchema.safeParse(query);
  return parsed.success ? parsed.data : {};
};

const filtroPeriodo = (periodo: { periodoInicio?: Date; periodoFim?: Date }) => ({
  ...(periodo.periodoInicio ? { gte: periodo.periodoInicio } : {}),
  ...(periodo.periodoFim ? { lte: periodo.periodoFim } : {}),
});

vendasRouter.get("/", async (req: any, res) => {
  const { pagina, limite } = lerPaginacao(req.query);
  const where = {
    userId: req.user.id,
    dataVenda: filtroPeriodo(lerPeriodo(req.query)),
  };

  const [dados, total] = await prisma.$transaction([
    prisma.venda.findMany({
      where,
      orderBy: { dataVenda: "desc" },
      skip: calcularSkip(pagina, limite),
      take: limite,
    }),
    prisma.venda.count({ where }),
  ]);

  res.json(montarPaginado(dados, total, { pagina, limite }));
});

// Precisa vir antes de "/:id" para não ser capturada pelo parâmetro.
vendasRouter.get("/resumo", async (req: any, res) => {
  const periodo = lerPeriodo(req.query);
  const where = {
    userId: req.user.id,
    dataVenda: filtroPeriodo(periodo),
  };

  const [agregados, porMes] = await Promise.all([
    prisma.venda.aggregate({
      where,
      _sum: { receita: true, custoTotal: true, lucroBruto: true },
      _count: { _all: true },
    }),
    prisma.$queryRaw<{ mes: string; receita: string; custo: string; lucro: string }[]>`
      SELECT to_char(date_trunc('month', "dataVenda"), 'YYYY-MM') AS mes,
             COALESCE(SUM(receita), 0)::text    AS receita,
             COALESCE(SUM("custoTotal"), 0)::text AS custo,
             COALESCE(SUM("lucroBruto"), 0)::text AS lucro
      FROM venda
      WHERE "userId" = ${req.user.id}
        AND (${periodo.periodoInicio ?? null}::timestamptz IS NULL OR "dataVenda" >= ${periodo.periodoInicio ?? null})
        AND (${periodo.periodoFim ?? null}::timestamptz IS NULL OR "dataVenda" <= ${periodo.periodoFim ?? null})
      GROUP BY 1
      ORDER BY 1 ASC
    `,
  ]);

  const receita = Number(agregados._sum.receita ?? 0);
  const custo = Number(agregados._sum.custoTotal ?? 0);
  const lucro = Number(agregados._sum.lucroBruto ?? 0);
  const quantidade = agregados._count._all;

  res.json({
    periodo,
    quantidade,
    receita,
    custo,
    lucro,
    margem: receita > 0 ? (lucro / receita) * 100 : 0,
    ticketMedio: quantidade > 0 ? receita / quantidade : 0,
    porMes: porMes.map((linha) => ({
      mes: linha.mes,
      receita: Number(linha.receita),
      custo: Number(linha.custo),
      lucro: Number(linha.lucro),
    })),
  });
});

// Exportação feita no servidor: o navegador baixa o arquivo pronto, sem
// carregar todas as vendas para filtrar localmente.
vendasRouter.get("/exportar", async (req: any, res) => {
  const formato = req.query.formato === "json" ? "json" : "csv";
  const where = {
    userId: req.user.id,
    dataVenda: filtroPeriodo(lerPeriodo(req.query)),
  };

  const vendas = await prisma.venda.findMany({
    where,
    orderBy: { dataVenda: "desc" },
    select: { dataVenda: true, receita: true, custoTotal: true, lucroBruto: true },
  });

  const carimbo = new Date().toISOString().slice(0, 10);
  const nomeArquivo = `vendas-${carimbo}.${formato}`;

  if (formato === "json") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
    return res.send(
      JSON.stringify(
        {
          geradoEm: new Date().toISOString(),
          quantidade: vendas.length,
          vendas: vendas.map((v) => ({
            data: v.dataVenda,
            receita: Number(v.receita),
            custo: Number(v.custoTotal),
            lucro: Number(v.lucroBruto),
          })),
        },
        null,
        2,
      ),
    );
  }

  const escapar = (valor: string | number) => `"${String(valor).replace(/"/g, '""')}"`;
  const linhas = [
    ["Data", "Receita", "Custo", "Lucro"].map(escapar).join(","),
    ...vendas.map((v) =>
      [
        v.dataVenda.toISOString().slice(0, 10),
        Number(v.receita).toFixed(2),
        Number(v.custoTotal).toFixed(2),
        Number(v.lucroBruto).toFixed(2),
      ]
        .map(escapar)
        .join(","),
    ),
  ];

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  return res.send(`\uFEFF${linhas.join("\n")}`);
});

vendasRouter.post("/", async (req: any, res) => {
  const parsed = vendaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }

  const { receita, custoTotal, dataVenda } = parsed.data;
  const lucroBruto = Number(receita) - Number(custoTotal);

  const venda = await prisma.venda.create({
    data: {
      receita,
      custoTotal,
      lucroBruto,
      dataVenda,
      userId: req.user.id,
    },
  });

  res.status(201).json(venda);
});

vendasRouter.get("/:id", async (req: any, res) => {
  const venda = await prisma.venda.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (!venda) {
    return res.status(404).json({ error: "Venda não encontrada" });
  }

  res.json(venda);
});

vendasRouter.delete("/:id", async (req: any, res) => {
  const venda = await prisma.venda.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (!venda) {
    return res.status(404).json({ error: "Venda não encontrada" });
  }

  await prisma.venda.delete({ where: { id: req.params.id } });
  res.status(204).send();
});