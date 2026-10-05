# Loja Automotiva — Sistema de Gestão Comercial e Financeira

> Projeto de Extensão desenvolvido no 4º período do curso de Engenharia de Software.

## 👥 Grupo

- Ariane Archanjo
- Lucas Dias
- Pedro Zarantino
- Yoram Pacheco

---

## 📋 Sobre o projeto

Sistema acadêmico voltado à **gestão comercial e financeira**, com foco no cálculo do preço de venda, na comparação entre custo e venda e na análise dos resultados obtidos.

O usuário pode se autenticar, visualizar um dashboard interativo, calcular o preço de venda em **três modos**, salvar os resultados, consultar o histórico, excluir registros e gerar relatórios com os valores utilizados.

Uma das principais funcionalidades é o **cálculo reverso**: o usuário informa o preço pelo qual pretende vender um produto e o sistema calcula quanto poderá gastar com compra, frete, taxas da plataforma e outras despesas.

Na parte financeira, o usuário registra dados de vendas, visualiza análises e acompanha receitas, custos e lucros.

---

## 🚀 Funcionalidades

- 🔐 Login e logout com sessão por cookie (Better Auth)
- 🛡️ Bloqueio temporário após 3 tentativas inválidas de login
- 📊 Dashboard com KPIs e gráficos de evolução mensal
- 🧮 **Cálculo de preço de venda em 3 modos**: `direto`, `reverso` e `vendaIdeal`
- ⚡ Prévia do cálculo em tempo real (simulação sem gravar)
- 🎯 Desconto da taxa da plataforma por meta de vendas
- 🕘 Histórico de cálculos com totais, lucro acumulado e preço médio
- 🗑️ Exclusão de registros (com confirmação)
- 💰 Registro de vendas com lucro bruto calculado no servidor
- 📈 Análises financeiras por período
- 📄 Relatórios de performance com exportação em **CSV e JSON**

---

## 🧮 Os três modos de cálculo

Todos os percentuais (imposto, taxa da plataforma, margem) incidem sobre o **preço de venda**, nunca sobre o custo de compra.

| Modo | Você informa | O sistema devolve |
|---|---|---|
| **Direto** | Preço de venda, custo, frete, percentuais | **Lucro** e margem obtida |
| **Reverso** | Preço de venda alvo, frete, percentuais, margem | **Custo máximo** de compra |
| **Venda ideal** | Custo, frete, percentuais, margem | **Melhor preço de venda** |

O motor fica no back-end ([`backend/src/lib/precificacao.ts`](./backend/src/lib/precificacao.ts)) e é a fonte única da verdade — o front-end apenas simula chamando a API. Detalhes das fórmulas em [docs/motor-de-precificacao.md](./docs/motor-de-precificacao.md).

---

## 🗂️ Estrutura

```
loja-automotiva/
├── backend/     # API REST (Node.js, Express, TypeScript, Prisma, Better Auth)
├── frontend/    # SPA (React 18, Vite, Tailwind CSS 4, Recharts)
└── docs/        # Documentação do sistema
```

Monorepo com **npm workspaces**: `npm install` na raiz instala os dois pacotes.

---

## 🛠️ Tecnologias utilizadas

### Back-end

- [Node.js](https://nodejs.org/) — ambiente de execução JavaScript
- [Express](https://expressjs.com/) — framework das rotas da API
- [PostgreSQL](https://www.postgresql.org/) — banco de dados relacional
- [Prisma](https://www.prisma.io/) — ORM e migrações
- [Better Auth](https://www.better-auth.com/) — autenticação e sessão
- [Zod](https://zod.dev/) — validação de dados de entrada
- [tsx](https://tsx.is/) — execução de TypeScript em desenvolvimento
- [Vitest](https://vitest.dev/) — testes automatizados

### Front-end

- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) — SPA
- [React Router](https://reactrouter.com/) — rotas
- [Tailwind CSS 4](https://tailwindcss.com/) — estilização (tema dark)
- [Recharts](https://recharts.org/) — gráficos
- [date-fns](https://date-fns.org/) — manipulação de datas
- [Better Auth React](https://www.better-auth.com/) — cliente de autenticação

### Qualidade de Código

- [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/) — padronização (back-end)
- [Vitest](https://vitest.dev/) — 20 testes unitários (motor de precificação, variáveis de ambiente, bloqueio de login)

---

## 📁 Documentação

| Documento | Conteúdo |
|---|---|
| [Índice da documentação](./docs/README.md) | Mapa de todos os documentos |
| [Visão Geral](./docs/visao-geral.md) | Objetivo, escopo, atores |
| [Requisitos (RF/RNF)](./docs/requisitos.md) | Requisitos funcionais e não funcionais |
| [Regras de Negócio (RN)](./docs/regras-de-negocio.md) | RN01–RN49, agrupadas por módulo |
| [Motor de Precificação](./docs/motor-de-precificacao.md) | Fórmulas, decisões de regra e vetores de teste |
| [API REST](./docs/api.md) | Referência dos endpoints, payloads e erros |
| [Modelo de Dados (MER)](./docs/modelo-de-dados-mer.md) | MER e mapeamento Prisma |
| [Arquitetura](./docs/arquitetura.md) | Casos de uso, fluxo do cálculo e arquitetura técnica |
| [Rastreabilidade](./docs/rastreabilidade.md) | Matriz RF × RN e cobertura de testes |
| [Configuração do Ambiente](./docs/configuracao-ambiente.md) | Pré-requisitos, instalação e execução |
| [Especificação Consolidada](./docs/especificacao-requisitos-sistema-comercial.md) | Documento único com todas as seções |

Detalhe técnico de cada pacote: [`backend/README.md`](./backend/README.md) e [`frontend/README.md`](./frontend/README.md).

---

## 📦 Como executar o projeto

### Pré-requisitos

- **Node.js >= 20**
- **PostgreSQL 16+** em execução

### 1. Instalar dependências e configurar o ambiente

```bash
git clone https://github.com/arianearchanjo/loja-automotiva.git
cd loja-automotiva
npm install

cd backend
cp .env.example .env   # ajuste DATABASE_URL e gere BETTER_AUTH_SECRET
```

### 2. Criar o banco e popular com dados de demonstração

```bash
npm run db:generate    # gera o Prisma Client
npm run db:migrate     # aplica as migrações
npm run db:seed        # cria o usuário inicial + vendas, cálculos e análises
```

### 3. Subir as duas aplicações

```bash
npm run dev            # na raiz: sobe back-end (3333) e front-end (5173)
```

| Serviço | URL |
|---|---|
| Front-end (Vite) | http://localhost:5173 |
| Back-end (Express) | http://localhost:3333 |
| Health check | http://localhost:3333/health |

O Vite faz proxy de `/api` para `http://localhost:3333`, então não há CORS a configurar em desenvolvimento.

Guia detalhado, incluindo solução de problemas, em [docs/configuracao-ambiente.md](./docs/configuracao-ambiente.md).

---

## 🗺️ Módulos entregues

| Módulo | Escopo |
|---|---|
| **Acesso** | Login e logout, sessão por cookie, bloqueio por tentativas |
| **Dashboard** | KPIs, evolução mensal, últimas vendas e últimos cálculos |
| **Cálculo de preço** | Três modos (direto, reverso e venda ideal) com prévia em tempo real |
| **Histórico** | Listagem paginada de cálculos, com totais agregados e exclusão |
| **Financeiro** | Registro de vendas e análises por período, ambas paginadas |
| **Relatórios** | Performance por período, com exportação em CSV e JSON geradas no servidor |

Detalhamento em [docs/rastreabilidade.md](./docs/rastreabilidade.md).

---

## 📄 Licença

Projeto acadêmico desenvolvido para fins de extensão universitária.
