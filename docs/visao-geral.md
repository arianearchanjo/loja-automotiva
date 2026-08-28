# Visão Geral

> Parte da documentação do Sistema de Gestão Comercial e Financeira.
> Veja também: [Requisitos](./requisitos.md), [Regras de Negócio](./regras-de-negocio.md),
> [Modelo de Dados (MER)](./modelo-de-dados-mer.md), [Arquitetura](./arquitetura.md),
> [Roadmap](./roadmap.md).

## 1. Visão Geral

O sistema é uma ferramenta acadêmica de **gestão comercial e financeira** voltada a um
usuário que hoje controla seu negócio por meio de múltiplas planilhas Excel. O objetivo
central é substituir esse controle manual por uma aplicação web capaz de:

- Calcular o **preço de venda** de produtos a partir de custos, frete e taxas;
- Executar o **cálculo reverso**: a partir do preço de venda desejado, determinar quanto
  pode ser gasto com compra, frete, taxas de plataforma e demais despesas;
- Comparar **custo × venda** e acompanhar receitas, custos e lucro;
- Manter **histórico** de cálculos e análises, com possibilidade de exclusão e geração de
  relatórios;
- Oferecer um **dashboard** interativo e personalizável como painel central de uso.

O sistema é de **usuário único** (single-tenant por conta), que desempenha todos os papéis
do processo comercial — do planejamento de compra ao pós-venda.

### 1.1 Objetivo do documento

Consolidar, organizar e complementar o levantamento inicial de requisitos (regras de
negócio e requisitos funcionais) e apresentar uma modelagem inicial do sistema (casos de
uso, modelo de dados e arquitetura) que sirva de base para o desenvolvimento incremental.

### 1.2 Fora de escopo (versão inicial)

Conforme definido pela equipe, o desenvolvimento seguirá uma abordagem incremental. Ficam
fora do MVP (podendo compor versões futuras):

- Múltiplos usuários/perfis (multiusuário, permissões, times);
- Integrações diretas com marketplaces/e-commerces (importação automática de taxas e vendas);
- Notificações automáticas (e-mail/push);
- Relatórios comparativos entre períodos e projeções financeiras avançadas;
- Aplicativo mobile nativo.

## 2. Stakeholders e Atores

| Ator | Descrição |
|---|---|
| **Usuário (Vendedor/Gestor)** | Ator único do sistema. Realiza login, cadastra cálculos e análises, consulta histórico, gera relatórios e configura o sistema. |
| **Sistema** | Executa validações, cálculos automáticos e geração de relatórios. |
| **Equipe de desenvolvimento** | Mantém o sistema, disponibiliza notas/contato via tela de configurações. |
