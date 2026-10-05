import { auth } from "../src/lib/auth.js";
import { prisma } from "../src/lib/prisma.js";
import { calcularPrecificacao } from "../src/lib/precificacao.js";
import { env } from "../src/env.js";

type VendaFake = {
  daysBack: number;
  receita: number;
  custo: number;
};

const VENDAS_FAKE: VendaFake[] = [
  { daysBack: 185, receita: 3500, custo: 2100 },
  { daysBack: 165, receita: 1250, custo: 780 },
  { daysBack: 150, receita: 5200, custo: 3150 },
  { daysBack: 140, receita: 900, custo: 520 },
  { daysBack: 120, receita: 2800, custo: 1720 },
  { daysBack: 105, receita: 4100, custo: 2530 },
  { daysBack: 92, receita: 1650, custo: 980 },
  { daysBack: 80, receita: 3200, custo: 2140 },
  { daysBack: 65, receita: 2350, custo: 1390 },
  { daysBack: 47, receita: 5800, custo: 3680 },
  { daysBack: 38, receita: 1750, custo: 1120 },
  { daysBack: 30, receita: 2900, custo: 1810 },
  { daysBack: 22, receita: 4300, custo: 2640 },
  { daysBack: 15, receita: 1500, custo: 910 },
  { daysBack: 9, receita: 3600, custo: 2210 },
  { daysBack: 5, receita: 6800, custo: 4150 },
  { daysBack: 2, receita: 2100, custo: 1330 },
];

// Cobre os 3 tipos de cálculo, com e sem meta de venda/desconto da plataforma.
// "precoVenda" e "custoCompra" ficam sem valor conforme o tipo pede; os campos
// derivados são sempre calculados pelo motor de precificação.
type CalculoFake = {
  nome: string;
  tipo: "direto" | "reverso" | "vendaIdeal";
  precoVenda?: number;
  custoCompra?: number;
  frete: number;
  taxaPlataformaPercentual: number;
  impostoPercentual: number;
  descontoPlataforma: number;
  metaVendaAlcancada: boolean;
  margemPercentual: number;
};

const CALCULOS_FAKE: CalculoFake[] = [
  {
    nome: "Kit pastilhas de freio dianteiro",
    tipo: "direto",
    precoVenda: 420,
    custoCompra: 280,
    frete: 25,
    taxaPlataformaPercentual: 12,
    impostoPercentual: 8,
    descontoPlataforma: 0,
    metaVendaAlcancada: false,
    margemPercentual: 15,
  },
  {
    nome: "Óleo de motor 5W30 (1L)",
    tipo: "direto",
    precoVenda: 48,
    custoCompra: 29,
    frete: 8,
    taxaPlataformaPercentual: 10,
    impostoPercentual: 18,
    descontoPlataforma: 20,
    metaVendaAlcancada: true,
    margemPercentual: 20,
  },
  {
    nome: "Bateria 60Ah — margem mínima",
    tipo: "reverso",
    precoVenda: 620,
    frete: 35,
    taxaPlataformaPercentual: 11,
    impostoPercentual: 12,
    descontoPlataforma: 0,
    metaVendaAlcancada: false,
    margemPercentual: 20,
  },
  {
    nome: "Amortecedor dianteiro (par)",
    tipo: "direto",
    precoVenda: 1180,
    custoCompra: 760,
    frete: 55,
    taxaPlataformaPercentual: 13,
    impostoPercentual: 10,
    descontoPlataforma: 25,
    metaVendaAlcancada: true,
    margemPercentual: 18,
  },
  {
    nome: "Correia dentada + tensor",
    tipo: "reverso",
    precoVenda: 890,
    frete: 40,
    taxaPlataformaPercentual: 12,
    impostoPercentual: 15,
    descontoPlataforma: 0,
    metaVendaAlcancada: false,
    margemPercentual: 22,
  },
  {
    nome: "Filtro de ar esportivo",
    tipo: "vendaIdeal",
    custoCompra: 115,
    frete: 14,
    taxaPlataformaPercentual: 10,
    impostoPercentual: 10,
    descontoPlataforma: 0,
    metaVendaAlcancada: false,
    margemPercentual: 5,
  },
];

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 864e5);
}

async function seedUsuario(): Promise<{ id: string; email: string }> {
  const existing = await prisma.usuario.findUnique({
    where: { email: env.SEED_ADMIN_EMAIL },
  });

  if (existing) {
    console.log(`[seed] usuário ${env.SEED_ADMIN_EMAIL} já existe — nada a fazer.`);
    return { id: existing.id, email: existing.email };
  }

  const { user, error } = await auth.api.signUpEmail({
    body: {
      email: env.SEED_ADMIN_EMAIL,
      password: env.SEED_ADMIN_PASSWORD,
      name: env.SEED_ADMIN_NAME,
    },
  });

  if (error || !user) {
    throw new Error(`[seed] falha ao criar usuário: ${error?.message ?? "erro desconhecido"}`);
  }

  console.log(`[seed] usuário ${user.email} criado com sucesso.`);
  return { id: user.id, email: user.email };
}

async function seedVendas(userId: string) {
  const vendas = await prisma.$transaction(
    VENDAS_FAKE.map((v) =>
      prisma.venda.create({
        data: {
          receita: v.receita,
          custoTotal: v.custo,
          lucroBruto: v.receita - v.custo,
          dataVenda: daysAgo(v.daysBack),
          userId,
        },
      }),
    ),
  );

  console.log(`[seed] ${vendas.length} vendas de demonstração criadas.`);
  return vendas;
}

async function seedCalculos(userId: string) {
  const calculos = await prisma.$transaction(
    CALCULOS_FAKE.map((c) => {
      // Mesma fonte de verdade da API: os derivados nunca são digitados.
      const saida = calcularPrecificacao({
        tipo: c.tipo,
        precoVenda: c.precoVenda ?? null,
        custoCompra: c.custoCompra ?? null,
        frete: c.frete,
        taxaPlataformaPercentual: c.taxaPlataformaPercentual,
        impostoPercentual: c.impostoPercentual,
        descontoPlataforma: c.descontoPlataforma,
        metaVendaAlcancada: c.metaVendaAlcancada,
        margemPercentual: c.margemPercentual,
      });

      return prisma.calculoPreco.create({
        data: {
          nome: c.nome,
          tipo: c.tipo,
          precoVenda: saida.precoVenda,
          custoCompra: saida.custoCompra,
          frete: c.frete,
          taxaPlataformaPercentual: c.taxaPlataformaPercentual,
          impostoPercentual: c.impostoPercentual,
          descontoPlataforma: c.metaVendaAlcancada ? c.descontoPlataforma : null,
          metaVendaAlcancada: c.metaVendaAlcancada,
          margemPercentual: c.margemPercentual,
          taxaEfetivaPercentual: saida.taxaEfetivaPercentual,
          valorImposto: saida.valorImposto,
          valorTaxa: saida.valorTaxa,
          lucro: saida.lucro,
          margemObtidaPercentual: saida.margemObtidaPercentual,
          resultado: saida.resultado,
          userId,
        },
      });
    }),
  );

  console.log(`[seed] ${calculos.length} cálculos de demonstração criados.`);
}

async function seedAnalises(userId: string, vendas: { id: string; dataVenda: Date; receita: bigint | number; custoTotal: bigint | number; lucroBruto: bigint | number }[]) {
  const now = new Date();
  const periods = [
    {
      rotulo: "mês atual",
      inicio: new Date(now.getFullYear(), now.getMonth(), 1),
      fim: now,
    },
    {
      rotulo: "mês anterior",
      inicio: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      fim: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
    },
    {
      rotulo: "últimos 90 dias",
      inicio: daysAgo(90),
      fim: now,
    },
  ];

  let count = 0;
  for (const p of periods) {
    const noPeriodo = vendas.filter(
      (v) => new Date(v.dataVenda) >= p.inicio && new Date(v.dataVenda) <= p.fim,
    );
    if (noPeriodo.length === 0) continue;

    const receitaTotal = noPeriodo.reduce((acc, v) => acc + Number(v.receita), 0);
    const custoTotal = noPeriodo.reduce((acc, v) => acc + Number(v.custoTotal), 0);
    const lucroTotal = noPeriodo.reduce((acc, v) => acc + Number(v.lucroBruto), 0);

    await prisma.analiseFinanceira.create({
      data: {
        periodoInicio: p.inicio,
        periodoFim: p.fim,
        receitaTotal,
        custoTotal,
        lucroTotal,
        userId,
        vendas: { connect: noPeriodo.map((v) => ({ id: v.id })) },
      },
    });
    count += 1;
  }

  console.log(`[seed] ${count} análises de demonstração criadas.`);
}

async function main(): Promise<void> {
  const user = await seedUsuario();

  const existingVendas = await prisma.venda.count({ where: { userId: user.id } });
  const existingCalculos = await prisma.calculoPreco.count({ where: { userId: user.id } });

  // Cada bloco é semeado de forma independente: assim a demonstração não fica
  // faltando quando só um dos conjuntos já existe.
  let vendas: { id: string; dataVenda: Date; receita: bigint | number; custoTotal: bigint | number; lucroBruto: bigint | number }[] = [];

  if (existingVendas > 0) {
    console.log(`[seed] já existem ${existingVendas} venda(s) — dados fake não duplicados.`);
    vendas = await prisma.venda.findMany({
      where: { userId: user.id },
      select: { id: true, dataVenda: true, receita: true, custoTotal: true, lucroBruto: true },
    });
  } else {
    vendas = await seedVendas(user.id);
  }

  if (existingCalculos > 0) {
    console.log(`[seed] já existem ${existingCalculos} cálculo(s) — dados fake não duplicados.`);
  } else {
    await seedCalculos(user.id);
  }

  const existingAnalises = await prisma.analiseFinanceira.count({ where: { userId: user.id } });
  if (existingAnalises > 0) {
    console.log(`[seed] já existem ${existingAnalises} análise(s) — dados fake não duplicados.`);
  } else {
    await seedAnalises(user.id, vendas);
  }

  console.log("[seed] dados de demonstração concluídos.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });