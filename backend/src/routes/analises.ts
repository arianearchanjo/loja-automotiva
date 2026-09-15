import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middlewares/auth.js";

export const analisesRouter = Router();

analisesRouter.use(requireAuth);

const analiseSchema = z.object({
  periodoInicio: z.coerce.date(),
  periodoFim: z.coerce.date(),
});

analisesRouter.get("/", async (req: any, res) => {
  const analises = await prisma.analiseFinanceira.findMany({
    where: { userId: req.user.id },
    orderBy: { criadoEm: "desc" },
  });
  res.json(analises);
});

analisesRouter.post("/", async (req: any, res) => {
  const parsed = analiseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }

  const { periodoInicio, periodoFim } = parsed.data;

  const vendas = await prisma.venda.findMany({
    where: {
      userId: req.user.id,
      dataVenda: { gte: periodoInicio, lte: periodoFim },
    },
  });

  const receitaTotal = vendas.reduce((acc, v) => acc + Number(v.receita), 0);
  const custoTotal = vendas.reduce((acc, v) => acc + Number(v.custoTotal), 0);
  const lucroTotal = vendas.reduce((acc, v) => acc + Number(v.lucroBruto), 0);

  const analise = await prisma.analiseFinanceira.create({
    data: {
      periodoInicio,
      periodoFim,
      receitaTotal,
      custoTotal,
      lucroTotal,
      userId: req.user.id,
    },
  });

  res.status(201).json(analise);
});

analisesRouter.get("/:id", async (req: any, res) => {
  const analise = await prisma.analiseFinanceira.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (!analise) {
    return res.status(404).json({ error: "Análise não encontrada" });
  }

  res.json(analise);
});

analisesRouter.delete("/:id", async (req: any, res) => {
  const analise = await prisma.analiseFinanceira.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (!analise) {
    return res.status(404).json({ error: "Análise não encontrada" });
  }

  await prisma.analiseFinanceira.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
