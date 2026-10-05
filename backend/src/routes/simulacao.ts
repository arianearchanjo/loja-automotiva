import { Router } from "express";
import { z } from "zod";
import { calcularPrecificacao, ErroPrecificacao } from "../lib/precificacao.js";
import { requireAuth } from "../middlewares/auth.js";

export const simulacaoRouter = Router();

simulacaoRouter.use(requireAuth);

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

const simulacaoSchema = z.object({
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

// Simulação em tempo real para o formulário: não persiste nada, o motor de
// precificação é a fonte da verdade do cálculo.
simulacaoRouter.post("/preco", (req, res) => {
  const parsed = simulacaoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }

  try {
    const resultado = calcularPrecificacao(parsed.data);
    return res.json(resultado);
  } catch (erro) {
    if (erro instanceof ErroPrecificacao) {
      return res.status(400).json({ error: erro.message });
    }
    return res.status(400).json({ error: "Não foi possível calcular o preço." });
  }
});