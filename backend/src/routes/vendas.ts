import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middlewares/auth.js";

export const vendasRouter = Router();

vendasRouter.use(requireAuth);

const vendaSchema = z.object({
  receita: z.coerce.number(),
  custoTotal: z.coerce.number(),
  dataVenda: z.coerce.date(),
});

vendasRouter.get("/", async (req: any, res) => {
  const vendas = await prisma.venda.findMany({
    where: { userId: req.user.id },
    orderBy: { dataVenda: "desc" },
  });
  res.json(vendas);
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
