-- AlterTable
ALTER TABLE "calculo_preco" ADD COLUMN     "descontoPercentual" DECIMAL(5,2),
ADD COLUMN     "metaVendas" DECIMAL(12,4),
ADD COLUMN     "vendasAcumuladas" DECIMAL(12,4);
