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

O usuário poderá realizar login e logout, acessar um dashboard interativo, inserir valores, executar cálculos, salvar resultados e consultar o histórico de operações, além de excluir registros e gerar relatórios com os valores utilizados, os resultados e a data da operação.

Uma das principais funcionalidades é o **cálculo reverso**: o usuário informa o preço pelo qual pretende vender um produto e o sistema calcula quanto poderá gastar com compra, frete, taxas da plataforma e outras despesas.

Na parte financeira, o usuário poderá registrar dados de vendas, visualizar análises e acompanhar receitas, custos e lucros. O sistema também conta com configurações básicas, informações de versão e contato/notas dos desenvolvedores.

Inicialmente serão desenvolvidas as funcionalidades essenciais (MVP), deixando recursos mais avançados para versões futuras.

---

## 🚀 Funcionalidades principais

- 🔐 Login e logout
- 📊 Dashboard interativo e personalizável
- 🧮 Cálculo de preço de venda (direto e reverso)
- 🕘 Histórico de cálculos e análises
- 🗑️ Exclusão de registros (com confirmação)
- 📄 Geração de relatórios (PDF / Excel)
- 💰 Gestão financeira (vendas, receitas, custos, lucros)
- ⚙️ Configurações e informações do sistema

---

## 🛠️ Tecnologias utilizadas

### Back-end

- [Node.js](https://nodejs.org/) — ambiente de execução JavaScript no back-end
- [Express](https://expressjs.com/) — framework para as rotas da API
- [MySQL](https://www.mysql.com/) — banco de dados relacional
- [Prisma](https://www.prisma.io/) — ORM para acesso e migrações do banco de dados
- [Better Auth](https://www.better-auth.com/) — biblioteca de autenticação
- [Zod](https://zod.dev/) — validação de dados de entrada

### Front-end

- [React](https://react.dev/) — construção do painel administrativo
- [Tailwind CSS](https://tailwindcss.com/) — estilização da landing page e do painel

### Gráficos e Relatórios

- [Chart.js](https://www.chartjs.org/) — visualização de dados em gráficos
- [jsPDF](https://github.com/parallax/jsPDF) — geração de relatórios em PDF
- [ExcelJS](https://github.com/exceljs/exceljs) — exportação de relatórios em Excel/CSV

### Qualidade de Código

- [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/) — padronização e formatação de código
- [Vitest](https://vitest.dev/) — testes automatizados

---

## 📁 Documentação

A especificação completa de requisitos (funcionais, não funcionais e regras de negócio) e a modelagem do sistema (casos de uso, modelo de dados e arquitetura) estão disponíveis em [`docs/especificacao-requisitos-sistema-comercial.md`](./docs/especificacao-requisitos-sistema-comercial.md).

---

## 📦 Como executar o projeto

> ⚠️ Instruções a serem detalhadas conforme o desenvolvimento avança.

```bash
# Clonar o repositório
git clone https://github.com/arianearchanjo/loja-automotiva.git
cd loja-automotiva

# Instalar dependências (back-end)
cd backend
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Rodar migrações do banco de dados
npx prisma migrate dev

# Iniciar o servidor de desenvolvimento
npm run dev
```

```bash
# Instalar dependências (front-end)
cd frontend
npm install
npm run dev
```

---

## 🗺️ Roadmap

| Fase | Escopo |
|---|---|
| **MVP** | Login/logout, dashboard, cálculo de preço (direto e reverso), histórico e exclusão |
| **v1.1** | Relatórios de cálculo, configurações básicas |
| **v1.2** | Módulo financeiro (registro de vendas e análises) |
| **v1.3** | Relatórios financeiros, contato/notas do desenvolvedor, tempo de uso, versão |
---

## 📄 Licença

Projeto acadêmico desenvolvido para fins de extensão universitária.
