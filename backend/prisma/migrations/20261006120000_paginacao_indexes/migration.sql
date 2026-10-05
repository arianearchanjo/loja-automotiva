-- Índices compostos para suportar a listagem paginada: as consultas de
-- listagem filtram por usuário e ordenam por data, e o filtro de período dos
-- relatórios usa dataVenda.
CREATE INDEX "calculo_preco_userId_criadoEm_idx" ON "calculo_preco"("userId", "criadoEm");
CREATE INDEX "venda_userId_dataVenda_idx" ON "venda"("userId", "dataVenda");
CREATE INDEX "analise_financeira_userId_criadoEm_idx" ON "analise_financeira"("userId", "criadoEm");