# Configuração do Ambiente

Guia passo a passo para configurar o ambiente de desenvolvimento do **Sistema de
Gestão Comercial e Financeira (Loja Automotiva)**.

## Visão geral

O projeto é um monorepo com **npm workspaces** e duas aplicações:

```
loja-automotiva/
├── backend/        # API REST (Node.js, Express, TypeScript, Prisma, Better Auth)
├── frontend/       # SPA (React 18, Vite, Tailwind CSS 4, Recharts)
└── docs/           # Documentação do sistema
```

| Aplicação | Porta | URL |
|---|---|---|
| Back-end (Express) | `3333` | http://localhost:3333 |
| Front-end (Vite) | `5173` | http://localhost:5173 |
| Health check | `3333` | http://localhost:3333/health |

## Pré-requisitos

Antes de começar, instale e verifique as versões:

- **Node.js >= 20** — verifique com `node --version`
- **npm** — acompanha o Node; verifique com `npm --version`
- **PostgreSQL 16+** em execução (local ou via Docker/container)

> As variáveis de ambiente exigem `BETTER_AUTH_SECRET` com ao menos 16
> caracteres e `DATABASE_URL` preenchida — caso contrário o servidor falha ao
> subir (a validação é feita por Zod em `backend/src/lib/env-schema.ts`).

## 1. Instalar dependências

Como o projeto usa workspaces, **uma única instalação na raiz cobre os dois pacotes**:

```bash
npm install
```

Para instalar apenas um pacote:

```bash
npm install --prefix backend
npm install --prefix frontend
```

## 2. Configurar variáveis de ambiente

Copie o modelo e ajuste os valores conforme o seu ambiente:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Back-end — `backend/.env`

| Variável | Descrição | Exemplo |
|---|---|---|
| `NODE_ENV` | Ambiente da aplicação | `development` |
| `PORT` | Porta do servidor Express | `3333` |
| `DATABASE_URL` | Conexão PostgreSQL no formato `postgresql://USUARIO:SENHA@HOST:PORTA/BANCO` | `postgresql://postgres:postgres@localhost:5432/loja_automotiva` |
| `BETTER_AUTH_SECRET` | Segredo para assinar sessões/tokens (mín. 16 caracteres) | gere com `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | URL pública da aplicação (callbacks de autenticação) | `http://localhost:3333` |
| `FRONTEND_URL` | Origem do front-end (liberada no CORS) | `http://localhost:5173` |
| `SEED_ADMIN_NAME` | Nome do usuário inicial criado pela seed | `Administrador` |
| `SEED_ADMIN_EMAIL` | E-mail do usuário inicial | `admin@loja.com` |
| `SEED_ADMIN_PASSWORD` | Senha do usuário inicial | defina uma senha sua |

> Não coloque aspas em volta dos valores — o CLI do Prisma não as remove.

### Front-end — `frontend/.env`

| Variável | Descrição | Padrão |
|---|---|---|
| `VITE_API_URL` | URL base da API usada pelo cliente do Better Auth | `http://localhost:3333` |

> O restante do front-end usa caminhos relativos (`/api/...`) e passa pelo proxy do Vite,
> então `VITE_API_URL` só importa para o hook de sessão.

## 3. Gerar o Prisma Client e criar o banco

```bash
npm run db:generate --prefix backend   # gera o Prisma Client a partir do schema
npm run db:migrate --prefix backend    # aplica as migrações
```

> O banco de dados informado em `DATABASE_URL` precisa existir; caso não exista,
> crie-o no PostgreSQL antes de rodar `db:migrate`.

## 4. Popular com dados de demonstração (opcional)

```bash
npm run db:seed --prefix backend
```

Cria o usuário inicial (usando as variáveis `SEED_ADMIN_*`) e popula vendas, cálculos e
análises de exemplo. O script é **idempotente**: se já houver dados para o usuário, ele não
duplica.

## 5. Executar o projeto

Na raiz do repositório, um único comando sobe as duas aplicações:

```bash
npm run dev
```

O `concurrently` exibe os logs lado a lado (`[backend]` e `[frontend]`). Para rodar
separadamente:

```bash
npm run dev --prefix backend    # tsx watch src/server.ts
npm run dev --prefix frontend   # vite
```

Acesse http://localhost:5173 e faça login com as credenciais do passo 4.

## 6. Scripts úteis

### Back-end (`--prefix backend`)

| Script | Descrição |
|---|---|
| `npm run dev` | Servidor em modo desenvolvimento (tsx watch) |
| `npm run build` | Gera o Prisma Client e compila para `dist/` |
| `npm start` | Executa a versão compilada |
| `npm run typecheck` | Verificação de tipos (`tsc --noEmit`) |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` / `format:check` | Prettier |
| `npm test` / `test:watch` | Vitest |
| `npm run db:migrate` / `db:deploy` | Migração em desenvolvimento / produção |
| `npm run db:generate` | Gera o Prisma Client |
| `npm run db:seed` | Popula o banco com dados de demonstração |
| `npm run db:studio` | Prisma Studio (inspeção visual do banco) |

### Front-end (`--prefix frontend`)

| Script | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento do Vite |
| `npm run build` | Verifica tipos e gera o bundle em `dist/` |
| `npm run preview` | Serve o build de produção |
| `npm run typecheck` | Verificação de tipos (`tsc --noEmit`) |

### Raiz

| Script | Descrição |
|---|---|
| `npm run dev` | Sobe back-end e front-end ao mesmo tempo |

## Solução de problemas

- **`EADDRINUSE: address already in use :::3333`** — já existe uma instância do back-end
  rodando. Descubra e encerre o processo que ocupa a porta:
  ```powershell
  Get-NetTCPConnection -LocalPort 3333 -State Listen |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
  ```
  Ou feche o terminal do `npm run dev` anterior.

- **Servidor não sobe com erro de variáveis de ambiente** — confira se `.env` existe e se
  `DATABASE_URL` e `BETTER_AUTH_SECRET` estão preenchidas conforme o esquema em
  `backend/src/lib/env-schema.ts`.

- **Erro de conexão com o PostgreSQL** — verifique se o PostgreSQL está em execução, se o
  host/porta/credenciais batem com a `DATABASE_URL` e se o banco foi criado.

- **Client do Prisma desatualizado** — após alterar `schema.prisma`, rode
  `npm run db:generate --prefix backend`.

- **Erro de P1001 ao rodar a seed** — o banco não está no ar ou a `DATABASE_URL` está
  errada; rode `db:migrate` antes da seed.

- **401 ao abrir as telas** — a sessão expirou ou o cookie não está sendo enviado. O
  front-end envia `credentials: "include"`; se o proxy do Vite estiver quebrado, o `GET`
  em `/api/auth/get-session` retorna erro.

- **A tela pede login em loop** — o Better Auth está apontando para a URL errada. Confira
  `BETTER_AUTH_URL` no `.env` do back-end e o proxy `/api` em `frontend/vite.config.ts`.

- **Erro 429 ao fazer login** — o bloqueio por tentativas (RN02) está ativo: 3 falhas
  seguidas bloqueiam o e-mail por 15 minutos. O estado é reiniciado ao subir o servidor.
