# Arquitetura

> Parte da documentação do Sistema de Gestão Comercial e Financeira.
> Veja também: [Visão Geral](./visao-geral.md), [Requisitos](./requisitos.md),
> [Regras de Negócio](./regras-de-negocio.md), [Modelo de Dados (MER)](./modelo-de-dados-mer.md),
> [Roadmap](./roadmap.md).

## 6.1 Diagrama de Casos de Uso

```mermaid
flowchart TD
    U((Usuário))

    U --> UC1[Login / Logout]
    U --> UC2[Visualizar Dashboard]
    U --> UC3[Cadastrar Cálculo de Preço]
    U --> UC4[Executar Cálculo Reverso]
    U --> UC5[Consultar Histórico de Cálculos]
    U --> UC6[Excluir Cálculo]
    U --> UC7[Gerar Relatório de Cálculo]
    U --> UC8[Registrar Dados de Venda]
    U --> UC9[Visualizar Análise Financeira]
    U --> UC10[Consultar Histórico de Análises]
    U --> UC11[Excluir Análise]
    U --> UC12[Gerar Relatório Financeiro]
    U --> UC13[Configurar Sistema]
    U --> UC14[Ver Contato/Notas do Desenvolvedor]
    U --> UC15[Ver Tempo de Uso e Versão]

    UC3 -.include.-> UC16[Validar Campos]
    UC4 -.include.-> UC16
    UC8 -.include.-> UC16
    UC6 -.include.-> UC17[Confirmar Exclusão]
    UC11 -.include.-> UC17
```

## 6.2 Fluxo do Cálculo Reverso (principal diferencial do sistema)

```mermaid
flowchart TD
    A[Usuário informa preço de venda desejado] --> B[Usuário informa taxas fixas da plataforma / % de comissão]
    B --> C{Dados válidos? RN09-RN14}
    C -- Não --> D[Exibir erro de validação]
    D --> A
    C -- Sim --> E[Sistema calcula valor líquido após taxas]
    E --> F[Sistema subtrai margem de lucro desejada]
    F --> G[Sistema apresenta valor máximo disponível para: compra + frete + despesas]
    G --> H{Usuário confirma salvar? RN17-RN18}
    H -- Sim --> I[Persistir cálculo com ID, valores, resultado, data/hora - RN15]
    H -- Não --> J[Descartar / permitir novo ajuste]
    I --> K[Disponível no Histórico e apto a gerar Relatório - RN25]
```

## 6.3 Arquitetura Técnica

```mermaid
flowchart LR
    subgraph Cliente
        R[React + Tailwind CSS]
    end

    subgraph API["Back-end (Node.js + Express)"]
        Auth[Better Auth]
        Val[Zod - validação]
        Routes[Rotas REST]
    end

    subgraph Dados
        Prisma[Prisma ORM]
        MySQL[(MySQL)]
    end

    subgraph Saida["Geração de Saída"]
        Chart[Chart.js]
        PDF[jsPDF]
        XLS[ExcelJS]
    end

    R -- HTTP/JSON --> Routes
    Routes --> Auth
    Routes --> Val
    Routes --> Prisma
    Prisma --> MySQL
    R --> Chart
    Routes --> PDF
    Routes --> XLS
```

| Camada | Tecnologia | Papel no sistema |
|---|---|---|
| Front-end | React + Tailwind CSS | Dashboard, formulários de cálculo, histórico, telas de configuração |
| Back-end | Node.js + Express | API REST que expõe as regras de negócio |
| Autenticação | Better Auth | Login, logout, sessão (RN01–RN06) |
| Validação | Zod | Validação de payloads no servidor (RN09–RN14, RNF03) |
| Persistência | Prisma + MySQL | Modelo de dados relacional (ver [MER](./modelo-de-dados-mer.md)) |
| Gráficos | Chart.js | Visualizações no dashboard e nas análises financeiras |
| Relatórios | jsPDF / ExcelJS | Exportação de relatórios (RF07, RF12, RNF08) |
| Qualidade | ESLint, Prettier, Vitest | Padronização e testes automatizados (RNF07) |
