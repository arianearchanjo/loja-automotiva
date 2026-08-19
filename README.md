# Sistema de Controle de Vendas — Loja Automotiva

Projeto de Extensão desenvolvido no 4º período do curso de Engenharia de Software.

## 👥 Grupo

- Ariane Archanjo
- Lucas Dias
- Pedro Zarantino
- Yoram Pacheco

## 📋 Sobre o Projeto

Sistema web para gestão de uma loja automotiva, composto por uma landing page institucional e um painel administrativo para controle de vendas, entradas e saídas de produtos. O sistema oferece visualização de dados por meio de gráficos e permite a geração de relatórios exportáveis, auxiliando na tomada de decisão do gestor do negócio.

## ✨ Funcionalidades

- **Landing Page**: página inicial da loja com apresentação do negócio, produtos/serviços e informações de contato.
- **Autenticação**: acesso restrito ao painel administrativo via login seguro.
- **Controle de Vendas**: registro e acompanhamento das vendas realizadas.
- **Controle de Entradas e Saídas**: gestão de estoque (movimentações de produtos).
- **Gráficos**: visualização de dados de vendas e movimentações em dashboards.
- **Relatórios Exportáveis**: geração de relatórios para análise e exportação (ex.: PDF/CSV).

## 🛠️ Tecnologias Utilizadas

### Back-end
- **[Node.js](https://nodejs.org/)** — ambiente de execução JavaScript no back-end
- **[Express](https://expressjs.com/)** — framework para as rotas da API
- **[MySQL](https://www.mysql.com/)** — banco de dados relacional
- **[Prisma](https://www.prisma.io/)** — ORM para acesso e migrações do banco de dados
- **[Better Auth](https://www.better-auth.com/)** — biblioteca de autenticação
- **[Zod](https://zod.dev/)** — validação de dados de entrada

### Front-end
- **[React](https://react.dev/)** — construção do painel administrativo
- **[Tailwind CSS](https://tailwindcss.com/)** — estilização da landing page e do painel

### Gráficos e Relatórios
- **[Chart.js](https://www.chartjs.org/)** — visualização de dados em gráficos
- **[jsPDF](https://github.com/parallax/jsPDF)** — geração de relatórios em PDF
- **[ExcelJS](https://github.com/exceljs/exceljs)** — exportação de relatórios em Excel/CSV

### Qualidade de Código
- **[ESLint](https://eslint.org/)** + **[Prettier](https://prettier.io/)** — padronização e formatação de código
- **[Vitest](https://vitest.dev/)** — testes automatizados

## 🚀 Como Executar o Projeto

### Pré-requisitos

- Node.js instalado (versão LTS recomendada)
- MySQL instalado e em execução
- npm ou yarn

### Passo a passo

```bash
# Clone o repositório
git clone <url-do-repositorio>

# Acesse a pasta do projeto
cd nome-do-projeto

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Preencha as variáveis (conexão com o banco, chaves do Better Auth, etc.)

# Execute as migrações do banco de dados
npm run migrate

# Inicie o servidor
npm run dev
```

O sistema estará disponível em `http://localhost:3000` (ou na porta configurada).

## 🗂️ Estrutura do Projeto

```
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── views/          # ou frontend separado
│   └── config/
├── public/
├── .env.example
├── package.json
└── README.md
```

> Ajuste esta seção conforme a estrutura real do repositório.

## 📊 Relatórios e Gráficos

O painel administrativo disponibiliza gráficos de desempenho de vendas e movimentações de estoque, além da opção de exportar relatórios para análise externa.

## 🎓 Contexto Acadêmico

Este projeto foi desenvolvido como parte do **Projeto de Extensão** do 4º período do curso de Engenharia de Software, com o objetivo de aplicar conhecimentos técnicos em uma solução real para uma loja automotiva.

## 📄 Licença

Este projeto foi desenvolvido para fins acadêmicos.
