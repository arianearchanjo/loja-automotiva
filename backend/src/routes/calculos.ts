import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middlewares/auth.js";

export const calculosRouter = Router();

calculosRouter.use(requireAuth);

const calculoSchema = z.object({
  nome: z.string().min(1).max(100),
  tipo: z.enum(["direto", "reverso"]),
  precoVenda: z.coerce.number().optional(),
  custoCompra: z.coerce.number().optional(),
  frete: z.coerce.number().optional(),
  taxaPlataforma: z.coerce.number().optional(),
  margemDesejada: z.coerce.number().optional(),
  resultado: z.coerce.number().optional(),
});

calculosRouter.get("/", async (req: any, res) => {
  const calculos = await prisma.calculoPreco.findMany({
    where: { userId: req.user.id },
    orderBy: { criadoEm: "desc" },
  });
  res.json(calculos);
});

calculosRouter.post("/", async (req: any, res) => {
  const parsed = calculoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }

  const calculo = await prisma.calculoPreco.create({
    data: {
      ...parsed.data,
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
