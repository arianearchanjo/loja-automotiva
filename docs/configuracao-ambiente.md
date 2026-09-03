# Configuração do Ambiente

Guia passo a passo para configurar o ambiente de desenvolvimento do **Sistema de
Gestão Comercial e Financeira (Loja Automotiva)**.

## Visão geral

O projeto é dividido em pasta(s) de aplicação. Atualmente existe apenas o
**backend**, uma API REST em **Node.js + Express + TypeScript** com **Prisma**
(MySQL) e **Better Auth** para autenticação.

```
loja-automotiva/
├── backend/        # API REST (Node.js, Express, TypeScript, Prisma, Better Auth)
└── docs/           # Documentação do projeto
```

## Pré-requisitos

Antes de começar, instale e verifique as versões:

- **Node.js >= 20** — verifique com `node --version`
- **npm** — acompanha o Node; verifique com `npm --version`
- **MySQL 8.x** em execução (local ou via Docker/container)

> As variáveis de ambiente exigem `BETTER_AUTH_SECRET` com ao menos 16
> caracteres e `DATABASE_URL` preenchida — caso contrário o servidor falha ao
> subir (a validação é feita por Zod em `src/lib/env-schema.ts`).

## 1. Instalar dependências

A partir da pasta `backend`:

```bash
npm install
```

## 2. Configurar variáveis de ambiente

Copie o modelo e ajuste os valores conforme o seu ambiente:

```bash
cp .env.example .env
```

Principais variáveis:

| Variável | Descrição | Exemplo |
|---|---|---|
| `NODE_ENV` | Ambiente da aplicação | `development` |
| `PORT` | Porta do servidor Express | `3333` |
| `DATABASE_URL` | Conexão MySQL no formato `mysql://USUARIO:SENHA@HOST:PORTA/BANCO` | `mysql://root:root@localhost:3306/loja_automotiva` |
| `BETTER_AUTH_SECRET` | Segredo para assinar sessões/tokens (mín. 16 caracteres) | gere com `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | URL pública da aplicação (callbacks de autenticação) | `http://localhost:3333` |
| `FRONTEND_URL` | Origem do front-end (liberada no CORS) | `http://localhost:5173` |

## 3. Gerar o Prisma Client e criar o banco

```bash
npm run db:generate   # gera o Prisma Client a partir do schema
npm run db:migrate    # aplica a migração inicial (cria as tabelas no MySQL)
```

> O banco de dados informado em `DATABASE_URL` precisa existir; caso não exista,
> crie-o no MySQL antes de rodar `db:migrate`.

## 4. Executar o servidor

```bash
npm run dev           # servidor em modo desenvolvimento (tsx watch)
```

O servidor sobe em `http://localhost:${PORT}`.

## Scripts úteis

| Script | Descrição |
|---|---|
| `npm run dev` | Servidor em modo desenvolvimento (tsx watch) |
| `npm run build` | Gera o Prisma Client e compila para `dist/` |
| `npm start` | Executa a versão compilada |
| `npm run typecheck` | Verificação de tipos (`tsc --noEmit`) |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` / `format:check` | Prettier |
| `npm test` / `test:watch` | Vitest |
| `npm run db:studio` | Prisma Studio (inspeção visual do banco) |

## Solução de problemas

- **Servidor não sobe com erro de variáveis de ambiente** — confira se `.env`
  existe e se `DATABASE_URL` e `BETTER_AUTH_SECRET` estão preenchidas conforme o
  esquema em `src/lib/env-schema.ts`.
- **Erro de conexão com o MySQL** — verifique se o MySQL está em execução, se o
  host/porta/credenciais batem com o `DATABASE_URL` e se o banco foi criado.
- **Client do Prisma desatualizado** — após alterar `schema.prisma`, rode
  `npm run db:generate`.
