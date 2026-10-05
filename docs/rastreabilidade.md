# Rastreabilidade

> Parte da documentação do Sistema de Gestão Comercial e Financeira.
> Veja também: [Visão Geral](./visao-geral.md), [Requisitos](./requisitos.md),
> [Regras de Negócio](./regras-de-negocio.md), [Arquitetura](./arquitetura.md),
> [Motor de Precificação](./motor-de-precificacao.md), [API REST](./api.md).

Matriz que liga cada requisito às regras de negócio que o implementam, e cada requisito às
suas embodyment no código.

## Requisitos funcionais × regras de negócio

| Requisito | Descrição resumida | Regras de negócio | Onde está implementado |
|---|---|---|---|
| RF01 | Login e logout | RN01–RN06 | `frontend/src/pages/Login.tsx`, `backend/src/lib/login-guard.ts`, Better Auth montado em `backend/src/app.ts` |
| RF02 | Dashboard interativo | RN06, RN38 | `frontend/src/pages/Dashboard.tsx` |
| RF03 | Registrar vendas | RN22, RN30 | `frontend/src/pages/Vendas.tsx`, `backend/src/routes/vendas.ts` |
| RF04 | Visualizar análises financeiras | RN24–RN26, RN30 | `frontend/src/pages/Analises.tsx`, `backend/src/routes/analises.ts` |
| RF05 | Cadastrar cálculos | RN07–RN15, RN43–RN49 | `frontend/src/pages/NovoCalculo.tsx`, `backend/src/routes/calculos.ts` |
| RF06 | Inserir valores e obter resultado | RN07–RN12, RN43–RN49 | `frontend/src/pages/NovoCalculo.tsx`, `backend/src/routes/simulacao.ts` |
| RF07 | Modo de cálculo direto | RN07–RN12, RN43–RN49 | `backend/src/lib/precificacao.ts` |
| RF08 | Modo de cálculo reverso | RN07–RN12, RN43–RN49 | `backend/src/lib/precificacao.ts` |
| RF09 | Modo de venda ideal | RN07–RN12, RN43–RN49 | `backend/src/lib/precificacao.ts` |
| RF10 | Prévia em tempo real | RN09, RN12, RN44 | `frontend/src/pages/NovoCalculo.tsx` |
| RF11 | Histórico de cálculos | RN13, RN17, RN18 | `frontend/src/pages/Calculos.tsx`, `backend/src/routes/calculos.ts` |
| RF12 | Excluir cálculo | RN19–RN21, RN33, RN34 | `frontend/src/pages/Calculos.tsx`, `backend/src/routes/calculos.ts` |
| RF13 | Histórico de análises | RN28, RN29 | `frontend/src/pages/Analises.tsx`, `backend/src/routes/analises.ts` |
| RF14 | Excluir análise | RN31, RN32, RN33, RN34 | `frontend/src/pages/Analises.tsx`, `backend/src/routes/analises.ts` |
| RF15 | Relatório de performance | RN23, RN25, RN26, RN30 | `frontend/src/pages/Relatorios.tsx`, `backend/src/routes/analises.ts` |
| RF16 | Exportar relatório em CSV e JSON | RN23 | `frontend/src/pages/Relatorios.tsx` |

## Requisitos não funcionais × regras de negócio

| Requisito | Categoria | Regras de negócio |
|---|---|---|
| RNF01 | Segurança | RN01, RN05 |
| RNF02 | Validação | RN07, RN08, RN12, RN49 |
| RNF03 | Usabilidade | RN09, RN37 |
| RNF04 | Desempenho | RN10 |
| RNF05 | Confiabilidade | RN35, RN41 |
| RNF06 | Manutenibilidade | RN43–RN49 |
| RNF07 | Portabilidade de dados | RN23 |
| RNF08 | Auditabilidade | RN13, RN28, RN39 |

## Regras de negócio × código

| Regras | Onde está implementada |
|---|---|
| RN01–RN06 | `backend/src/lib/auth.ts`, `backend/src/lib/login-guard.ts`, `backend/src/middlewares/auth.ts`, `frontend/src/lib/auth-client.ts` |
| RN07–RN12, RN49 | esquemas Zod em `backend/src/routes/`, `backend/src/lib/precificacao.ts` e `frontend/src/lib/format.ts` |
| RN13–RN16, RN36, RN40 | `backend/src/routes/calculos.ts`, `frontend/src/pages/NovoCalculo.tsx` |
| RN17–RN21 | `frontend/src/pages/Calculos.tsx`, `backend/src/routes/calculos.ts` |
| RN22–RN32 | `backend/src/routes/vendas.ts`, `backend/src/routes/analises.ts`, `frontend/src/pages/Analises.tsx` |
| RN33, RN34 | `frontend/src/components/ui.tsx` |
| RN35, RN38, RN41 | `backend/src/lib/auth.ts`, `backend/src/app.ts` e `frontend/src/lib/api.ts` |
| RN37 | `frontend/src/components/ui.tsx` |
| RN39, RN42 | filtros por usuário em todas as rotas (`usuarioId`) |
| RN43–RN49 | `backend/src/lib/precificacao.ts` |

## Cobertura de testes

| Suíte | Arquivo | Itens cobertos |
|---|---|---|
| Motor de precificação | `backend/src/lib/precificacao.test.ts` | RN43–RN49: base sobre preço de venda, arredondamento para cima, ausência de margem negativa, meta de venda, piso de taxa efetiva, limites de percentual e os três modos |
| Bloqueio de login | `backend/src/lib/login-guard.test.ts` | RN02: bloqueio após três tentativas e liberação após a janela |
| Validação de entrada | `backend/src/lib/validacao.test.ts` | RN07–RN12, RN49: campos obrigatórios, vírgula/ponto decimal, percentuais fora de 0–100 e valores ausentes como zero |

Os testes são executados com `npm test --prefix backend`.