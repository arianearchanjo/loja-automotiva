-- CreateEnum
CREATE TYPE "TipoCalculo" AS ENUM ('direto', 'reverso');

-- CreateEnum
CREATE TYPE "OrigemRelatorio" AS ENUM ('calculo', 'analise');

-- CreateEnum
CREATE TYPE "FormatoRelatorio" AS ENUM ('pdf', 'xlsx');

-- CreateTable
CREATE TABLE "usuario" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calculo_preco" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoCalculo" NOT NULL,
    "precoVenda" DECIMAL(12,4),
    "custoCompra" DECIMAL(12,4),
    "frete" DECIMAL(12,4),
    "taxaPlataforma" DECIMAL(12,4),
    "margemDesejada" DECIMAL(12,4),
    "resultado" DECIMAL(12,4),
    "analiseId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calculo_preco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venda" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "receita" DECIMAL(12,4) NOT NULL,
    "custoTotal" DECIMAL(12,4) NOT NULL,
    "lucroBruto" DECIMAL(12,4) NOT NULL,
    "dataVenda" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "venda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analise_financeira" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodoInicio" TIMESTAMP(3) NOT NULL,
    "periodoFim" TIMESTAMP(3) NOT NULL,
    "receitaTotal" DECIMAL(12,4) NOT NULL,
    "custoTotal" DECIMAL(12,4) NOT NULL,
    "lucroTotal" DECIMAL(12,4) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analise_financeira_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relatorio" (
    "id" TEXT NOT NULL,
    "origemTipo" "OrigemRelatorio" NOT NULL,
    "origemId" TEXT NOT NULL,
    "formato" "FormatoRelatorio" NOT NULL,
    "geradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relatorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracao" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferenciasDashboard" JSONB NOT NULL,
    "versaoSistema" TEXT NOT NULL,

    CONSTRAINT "configuracao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AnaliseFinanceiraToVenda" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AnaliseFinanceiraToVenda_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "calculo_preco_userId_idx" ON "calculo_preco"("userId");

-- CreateIndex
CREATE INDEX "venda_userId_idx" ON "venda"("userId");

-- CreateIndex
CREATE INDEX "analise_financeira_userId_idx" ON "analise_financeira"("userId");

-- CreateIndex
CREATE INDEX "relatorio_origemId_idx" ON "relatorio"("origemId");

-- CreateIndex
CREATE UNIQUE INDEX "configuracao_userId_key" ON "configuracao"("userId");

-- CreateIndex
CREATE INDEX "_AnaliseFinanceiraToVenda_B_index" ON "_AnaliseFinanceiraToVenda"("B");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calculo_preco" ADD CONSTRAINT "calculo_preco_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calculo_preco" ADD CONSTRAINT "calculo_preco_analiseId_fkey" FOREIGN KEY ("analiseId") REFERENCES "analise_financeira"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venda" ADD CONSTRAINT "venda_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analise_financeira" ADD CONSTRAINT "analise_financeira_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuracao" ADD CONSTRAINT "configuracao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AnaliseFinanceiraToVenda" ADD CONSTRAINT "_AnaliseFinanceiraToVenda_A_fkey" FOREIGN KEY ("A") REFERENCES "analise_financeira"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AnaliseFinanceiraToVenda" ADD CONSTRAINT "_AnaliseFinanceiraToVenda_B_fkey" FOREIGN KEY ("B") REFERENCES "venda"("id") ON DELETE CASCADE ON UPDATE CASCADE;
