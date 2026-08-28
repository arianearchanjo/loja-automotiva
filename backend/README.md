# Back-end — Loja Automotiva

API REST em **Node.js + Express + TypeScript**, com **Prisma** (MySQL) e **Better Auth**.

> Esta pasta corresponde à **Etapa 1 — Configuração do Ambiente**.

## Pré-requisitos

- Node.js >= 20
- MySQL 8.x em execução (local ou container)
- `npm` (acompanha o Node)

## Instalação

```bash
npm install
cp .env.example .env   # ajuste DATABASE_URL e BETTER_AUTH_SECRET
```

Gere o client do Prisma e crie o banco:

```bash
npm run db:generate          # gera o Prisma Client
npm run db:migrate           # cria as tabelas no MySQL (migração inicial)
```

## Scripts

| Script | Descrição |
|---|---|
| `npm run dev` | Servidor em modo desenvolvimento (tsx watch) |
| `npm run build` | Gera o Prisma Client e compila para `dist/` |
| `npm start` | Executa a versão compilada |
| `npm run typecheck` | Verificação de tipos (tsc --noEmit) |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` / `format:check` | Prettier |
| `npm test` / `test:watch` | Vitest |
| `npm run db:studio` | Prisma Studio (inspeção do banco) |

## Estrutura

```
backend/
├── prisma/
│   └── schema.prisma        # modelo de dados (MySQL)
├── src/
│   ├── env.ts               # validação de variáveis (Zod)
│   ├── lib/
│   │   ├── env-schema.ts    # schema Zod das variáveis
│   │   ├── prisma.ts        # instância do Prisma Client
│   │   └── auth.ts          # configuração do Better Auth
│   ├── app.ts               # aplicação Express
│   └── server.ts            # bootstrap
├── .env.example             # modelo de variáveis de ambiente
└── package.json
```

## Variáveis de ambiente

Veja `.env.example`. Destaques:

- `DATABASE_URL` — `mysql://USUARIO:SENHA@HOST:PORTA/BANCO`
- `BETTER_AUTH_SECRET` — gere com `openssl rand -base64 32`
- `BETTER_AUTH_URL` / `FRONTEND_URL` — URLs de callback e CORS
