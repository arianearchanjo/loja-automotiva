-- Cálculo de preço com percentuais sobre o valor de venda.
--
-- PostgreSQL 18: ALTER TYPE ... ADD VALUE pode rodar dentro de transação,
-- então esta migration é única (em versões < 12 seria preciso separar).

-- Altera TipoCalculo: novo valor "vendaIdeal"
ALTER TYPE "TipoCalculo" ADD VALUE IF NOT EXISTS 'vendaIdeal';

-- Percentuais informados pelo usuário
-- (não há conversão de "margemDesejada"/"taxaPlataforma" em R$ para %:
--  a unidade mudou, portanto as colunas antigas são descartadas)
ALTER TABLE "calculo_preco" ADD COLUMN "taxaPlataformaPercentual" DECIMAL(5,2);
ALTER TABLE "calculo_preco" ADD COLUMN "impostoPercentual" DECIMAL(5,2);
ALTER TABLE "calculo_preco" ADD COLUMN "descontoPlataforma" DECIMAL(5,2);
ALTER TABLE "calculo_preco" ADD COLUMN "metaVendaAlcancada" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "calculo_preco" ADD COLUMN "margemPercentual" DECIMAL(5,2);

-- Campos calculados pelo motor de precificação
ALTER TABLE "calculo_preco" ADD COLUMN "taxaEfetivaPercentual" DECIMAL(5,2);
ALTER TABLE "calculo_preco" ADD COLUMN "valorImposto" DECIMAL(12,4);
ALTER TABLE "calculo_preco" ADD COLUMN "valorTaxa" DECIMAL(12,4);
ALTER TABLE "calculo_preco" ADD COLUMN "lucro" DECIMAL(12,4);
ALTER TABLE "calculo_preco" ADD COLUMN "margemObtidaPercentual" DECIMAL(5,2);

-- Campos antigos (valores em R$): sem conversão possível para %, são descartados
ALTER TABLE "calculo_preco" DROP COLUMN "margemDesejada";
ALTER TABLE "calculo_preco" DROP COLUMN "taxaPlataforma";

-- Meta de venda deixa de ser detectada por valores acumulados: neste ciclo é
-- informada manualmente pelo usuário.
ALTER TABLE "calculo_preco" DROP COLUMN "vendasAcumuladas";
ALTER TABLE "calculo_preco" DROP COLUMN "metaVendas";
ALTER TABLE "calculo_preco" DROP COLUMN "descontoPercentual";