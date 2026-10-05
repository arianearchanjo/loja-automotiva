# Back-end — Loja Automotiva

API REST em **Node.js + Express + TypeScript**, com **Prisma** (PostgreSQL) e **Better Auth**.

## Pré-requisitos

- Node.js >= 20
- PostgreSQL 16+ em execução (local ou container)
- `npm` (acompanha o Node)

## Instalação

O repositório usa **npm workspaces**: basta rodar `npm install` na raiz. Para trabalhar só
neste pacote:

```bash
npm install
cp .env.example .env   # ajuste DATABASE_URL e BETTER_AUTH_SECRET
```

Gere o client do Prisma e crie o banco:

```bash
npm run db:generate          # gera o Prisma Client
npm run db:migrate           # aplica as migrações
npm run db:seed              # usuário inicial + dados de demonstração
```

## Scripts

| Script | Descrição |
|---|---|
| `npm run dev` | Servidor em modo desenvolvimento (tsx watch) |
| `npm run build` | Gera o Prisma Client e compila para `dist/` |
| `npm start` | Executa a versão compilada |
| `npm run typecheck` | Verificação de tipos (`tsc --noEmit`) |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` / `format:check` | Prettier |
| `npm test` / `test:watch` | Vitest (20 testes) |
| `npm run db:migrate` / `db:deploy` | Migração em desenvolvimento / produção |
| `npm run db:seed` | Popula o banco com dados de demonstração |
| `npm run db:studio` | Prisma Studio (inspeção visual do banco) |

## Estrutura

```
backend/
├── prisma/
│   ├── schema.prisma        # modelo de dados (PostgreSQL)
│   ├── seed.ts              # dados de demonstração (usuários, vendas, cálculos, análises)
│   └── migrations/          # migrações versionadas
├── src/
│   ├── server.ts            # bootstrap + graceful shutdown
│   ├── app.ts               # aplicação Express (CORS, Better Auth, routers)
│   ├── env.ts               # carga e validação das variáveis de ambiente
│   ├── lib/
│   │   ├── precificacao.ts       # MOTOR DE PRECIFICAÇÃO (fonte única da verdade)
│   │   ├── precificacao.test.ts  # 13 testes do motor
│   │   ├── auth.ts               # configuração do Better Auth
│   │   ├── login-guard.ts        # bloqueio após tentativas inválidas (RN02)
│   │   ├── login-guard.test.ts
│   │   ├── env-schema.ts         # schema Zod das variáveis
│   │   ├── env-schema.test.ts
│   │   └── prisma.ts             # instância do Prisma Client
│   ├── middlewares/
│   │   └── auth.ts               # requireAuth — exige sessão válida
│   └── routes/
│       ├── calculos.ts           # /api/calculos
│       ├── simulacao.ts          # /api/simulacoes
│       ├── vendas.ts             # /api/vendas
│       └── analises.ts           # /api/analises
├── vitest.config.ts
├── eslint.config.mjs
└── .env.example
```

## Endpoints

Todos os routers de negócio usam `requireAuth`. Referência completa, com payloads e
formatos de erro, em [`../docs/api.md`](../docs/api.md).

| Método | Rota | Descrição |
|---|---|---|
| `ALL` | `/api/auth/*` | Better Auth (login, logout, sessão) |
| `GET` | `/health` | `{ status, env }` |
| `GET` | `/` | Nome e versão da API |
| `GET` `POST` | `/api/calculos` | Listar / criar cálculo |
| `GET` `DELETE` | `/api/calculos/:id` | Detalhe / excluir cálculo |
| `POST` | `/api/simulacoes/preco` | Simular sem persistir |
| `GET` `POST` | `/api/vendas` | Listar / registrar venda |
| `GET` `DELETE` | `/api/vendas/:id` | Detalhe / excluir venda |
| `GET` `POST` | `/api/analises` | Listar / agregar análise por período |
| `GET` `DELETE` | `/api/analises/:id` | Detalhe / excluir análise |

## Motor de precificação

`src/lib/precificacao.ts` é um módulo **puro** (sem Prisma, Express ou I/O) e a **fonte
única da verdade** do cálculo de preço. Ele implementa os três modos — `direto`,
`reverso` e `vendaIdeal` — com todos os percentuais incidindo sobre o preço de venda.

As rotas nunca recalculam nada por conta própria: o cliente envia apenas campos de
entrada e o motor devolve os derivados (`taxaEfetivaPercentual`, `valorImposto`,
`valorTaxa`, `lucro`, `margemObtidaPercentual`, `resultado`).

Fórmulas, decisões de regra e vetores de teste em
[`../docs/motor-de-precificacao.md`](../docs/motor-de-precificacao.md).

## Testes

```bash
npm test
```

| Arquivo | Cobertura |
|---|---|
| `src/lib/precificacao.test.ts` | 13 casos: modos direto/reverso/vendaIdeal, taxa efetiva, percentuais inválidos, margem impossível, campos faltando, garantia de não gerar `NaN`/`Infinity` |
| `src/lib/login-guard.test.ts` | 4 casos: limite de tentativas, bloqueio, sucesso limpando a contagem |
| `src/lib/env-schema.test.ts` | 3 casos: defaults, segredo curto, coerção de tipos |

## Variáveis de ambiente

Veja `.env.example`. Destaques:

| Variável | Descrição |
|---|---|
| `NODE_ENV` | Ambiente da aplicação (`development`) |
| `PORT` | Porta do Express (`3333`) |
| `DATABASE_URL` | `postgresql://USUARIO:SENHA@HOST:PORTA/BANCO` |
| `BETTER_AUTH_SECRET` | Segredo de assinatura — gere com `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | URL pública da API (callbacks de autenticação) |
| `FRONTEND_URL` | Origem liberada no CORS |
| `SEED_ADMIN_*` | Usuário criado pelo `npm run db:seed` |

A validação é feita por Zod em `src/lib/env-schema.ts`: se alguma variável obrigatória
faltar, o servidor não sobe.
