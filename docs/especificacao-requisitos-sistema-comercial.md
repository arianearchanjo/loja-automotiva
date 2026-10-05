# Especificação de Requisitos e Modelagem do Sistema
## Sistema de Gestão Comercial e Financeira com Cálculo de Preço de Venda

**Repositório:** [github.com/arianearchanjo/loja-automotiva](https://github.com/arianearchanjo/loja-automotiva/tree/main)
**Versão do documento:** 2.0
**Status:** Versão final — corresponde ao sistema implementado

---

## 1. Visão Geral

O sistema é uma ferramenta acadêmica de **gestão comercial e financeira** voltada a um usuário que hoje controla seu negócio por meio de múltiplas planilhas Excel. O objetivo central é substituir esse controle manual por uma aplicação web capaz de:

- Calcular o **preço de venda** de produtos a partir de custos, frete e taxas;
- Executar o **cálculo reverso**: a partir do preço de venda desejado, determinar quanto pode ser gasto com compra, frete, taxas de plataforma e demais despesas;
- Comparar **custo × venda** e acompanhar receitas, custos e lucro;
- Manter **histórico** de cálculos e análises, com possibilidade de exclusão e geração de relatórios;
- Oferecer um **dashboard** interativo e personalizável como painel central de uso.

O sistema é de **usuário único** (single-tenant por conta), que desempenha todos os papéis do processo comercial — do planejamento de compra ao pós-venda.

### 1.1 Objetivo do documento

Consolidar, organizar e complementar o levantamento inicial de requisitos (regras de negócio e requisitos funcionais) e apresentar uma modelagem inicial do sistema (casos de uso, modelo de dados e arquitetura) que sirva de base para o desenvolvimento incremental do projeto.

### 1.2 Fora de escopo (versão inicial)

Conforme definido pela equipe, o desenvolvimento seguirá uma abordagem incremental. Ficam fora do MVP (podendo compor versões futuras):

- Múltiplos usuários/perfis (multiusuário, permissões, times);
- Integrações diretas com marketplaces/e-commerces (importação automática de taxas e vendas);
- Notificações automáticas (e-mail/push);
- Relatórios comparativos entre períodos e projeções financeiras avançadas;
- Aplicativo mobile nativo.

---

## 2. Stakeholders e Atores

| Ator | Descrição |
|---|---|
| **Usuário (Vendedor/Gestor)** | Ator único do sistema. Realiza login, cadastra cálculos e análises, consulta histórico, gera relatórios e configura o sistema. |
| **Sistema** | Executa validações, cálculos automáticos e geração de relatórios. |
| **Equipe de desenvolvimento** | Mantém o sistema, disponibiliza notas/contato via tela de configurações. |

---

## 3. Requisitos Funcionais (RF)

A tabela completa está em [Requisitos](./requisitos.md).

### Acesso e dashboard

| ID | Requisito |
|---|---|
| RF01 | **Login** e **logout**. |
| RF02 | **Dashboard** interativo com indicadores de desempenho e evolução de vendas, como tela inicial pós-login. |
| RF03 | **Registrar vendas** (receita, custo e lucro). |
| RF04 | **Visualizar análises financeiras** dos dados registrados, com receitas, custos, margens e lucro por período. |

### Gestão de vendas (cálculo de preço)

| ID | Requisito |
|---|---|
| RF05 | **Cadastrar cálculos** de preço, que ficam salvos no sistema. |
| RF06 | **Inserir valores** (custo, frete, taxas, margem desejada etc.) e obter o **resultado calculado**. |
| RF07 | Modo de **cálculo direto**: a partir do custo, frete e percentuais, calcular o preço de venda mínimo para a margem desejada. |
| RF08 | Modo de **cálculo reverso**: a partir do preço de venda informado, calcular o valor máximo disponível para compra, frete, taxas e demais despesas. |
| RF09 | Modo de **venda ideal**: a partir do custo, frete e percentuais, calcular o preço de venda que entrega a maior margem possível. |
| RF10 | Resultado **previsto em tempo real** enquanto o usuário preenche o formulário, sem gravar nada. |
| RF11 | **Consultar o histórico** de cálculos realizados. |
| RF12 | **Excluir** um cálculo do histórico. |

> **Decisão de regra.** Todos os percentuais — imposto, taxa da plataforma e margem —
> incidem sobre o **preço de venda**, nunca sobre o custo de compra. Com isso os modos se
> unificaram: `vendaIdeal` é a inversão de `reverso`.

### Relatórios

| ID | Requisito |
|---|---|
| RF13 | **Consultar o histórico** de análises financeiras. |
| RF14 | **Excluir** uma análise financeira. |
| RF15 | **Gerar relatório** de performance com receitas, custos, despesas, taxas, margem, lucro e preço médio de venda. |
| RF16 | Relatório **exportável** em CSV e JSON. |

---

## 4. Requisitos Não Funcionais (RNF)

| ID | Categoria | Requisito |
|---|---|---|
| RNF01 | Segurança | Senhas com hash (via Better Auth) e sessão que expira por inatividade (RN05). |
| RNF02 | Validação | Toda entrada no back-end validada com Zod antes da persistência, em defesa à profundidade da validação de front-end. |
| RNF03 | Usabilidade | Interface responsiva (desktop e mobile), construída com Tailwind CSS. |
| RNF04 | Desempenho | Cálculo com resultado em até 1 s em condições normais de uso. |
| RNF05 | Confiabilidade | Falhas de conexão ou do sistema não corrompem nem apagam dados já persistidos (RN35, RN41). |
| RNF06 | Manutenibilidade | Padronização via ESLint + Prettier e testes automatizados (Vitest) para o motor de cálculo. |
| RNF07 | Portabilidade de dados | Relatórios exportáveis em CSV e JSON. |
| RNF08 | Auditabilidade | Criação e exclusão de registros carregam o usuário responsável e a data/hora (RN39). |

---

## 5. Regras de Negócio (RN)

As **RN01–RN49**, organizadas por módulo, estão em
[Regras de Negócio](./regras-de-negocio.md). Resumo por bloco:

| Bloco | Regras | Tema |
|---|---|---|
| RN01–RN06 | Acesso | Login, bloqueio por tentativas, sessão e isolamento por usuário |
| RN07–RN21 | Vendas e cálculos | Campos obrigatórios, validação, histórico e exclusão |
| RN22–RN32 | Financeiro | Registro de vendas, análises por período e exclusão |
| RN33–RN42 | Proteção | Confirmação, integridade dos dados e mensagens de erro |
| RN43–RN49 | Motor de precificação | Percentuais sobre o preço de venda, arredondamento e meta de venda |

---

## 6. Modelagem do Sistema

### 6.1 Diagrama de Casos de Uso

O diagrama completo está em [Arquitetura](./arquitetura.md).

### 6.2 Fluxo do Cálculo de Preço (principal diferencial do sistema)

O fluxo completo, com os três modos, está em [Arquitetura](./arquitetura.md); as fórmulas,
em [Motor de Precificação](./motor-de-precificacao.md).

### 6.3 Modelo Conceitual de Dados

O MER completo, com o mapeamento Prisma e as regras de `onDelete`, está em
[Modelo de Dados (MER)](./modelo-de-dados-mer.md).

Resumo das entidades persistidas:

| Entidade | Papel | RN |
|---|---|---|
| `USER` + `ACCOUNT` + `SESSION` + `VERIFICATION` | Autenticação gerenciada pelo Better Auth | RN01–RN06 |
| `CALCULO_PRECO` | Um cálculo de preço nos modos direto, reverso ou venda ideal, com entradas e derivados | RN07–RN21, RN43–RN49 |
| `VENDA` | Uma venda registrada, com receita, custo e lucro | RN22, RN30 |
| `ANALISE_FINANCEIRA` | Agregação por período, vinculada a uma venda | RN24–RN29 |
| `ATTEMPT` | Tentativas de login, para o bloqueio RN02 | RN02 |

Não há entidade `RELATORIO`: o relatório é montado sob demanda a partir de
`/api/vendas/resumo` e de `/api/vendas/exportar`, que devolvem o arquivo pronto.

### 6.4 Arquitetura Técnica

O diagrama e a tabela de camadas estão em [Arquitetura](./arquitetura.md).

---

## 7. Rastreabilidade — Requisitos × Regras de Negócio

| Requisito Funcional | Regras de negócio relacionadas |
|---|---|
| RF01 (Login/Logout) | RN01–RN06 |
| RF02 (Dashboard) | RN06, RN38 |
| RF03 (Registrar vendas) | RN22, RN30 |
| RF04 (Visualizar análises) | RN24–RN26, RN30 |
| RF05–RF06 (Cadastrar/inserir valores) | RN07–RN15, RN43–RN49 |
| RF07 (Cálculo direto) | RN07–RN12, RN43–RN49 |
| RF08 (Cálculo reverso) | RN07–RN12, RN43–RN49 |
| RF09 (Venda ideal) | RN07–RN12, RN43–RN49 |
| RF10 (Prévia em tempo real) | RN09, RN12, RN44 |
| RF11 (Histórico de cálculos) | RN13, RN17, RN18 |
| RF12 (Excluir cálculo) | RN19–RN21, RN33, RN34 |
| RF13 (Histórico de análises) | RN28, RN29 |
| RF14 (Excluir análise) | RN31, RN32, RN33, RN34 |
| RF15 (Relatório de performance) | RN23, RN25, RN26, RN30 |
| RF16 (Exportar CSV/JSON) | RN23 |
| Transversal (todos) | RN33–RN42 |

A matriz completa, com o código que implementa cada regra e a cobertura de testes, está em
[Rastreabilidade](./rastreabilidade.md).

---

## 8. Decisões de Arquitetura

| Decisão | Motivo |
|---|---|
| Fórmula no back-end | O motor puro (`precificacao.ts`) roda na simulação e no salvamento, então o valor previsto e o salvo nunca divergem. |
| Percentuais sobre o preço de venda | Uniformiza os três modos: `vendaIdeal` é a inversão de `reverso` (RN43). |
| Listagens paginadas | `skip`/`take` com `limite` máximo de 100 mantém o custo por query previsível conforme o histórico cresce. |
| Cards e gráficos agregados no banco | `aggregate`, `count`, `groupBy` e `date_trunc` no PostgreSQL, em vez de somar no navegador — evita carregar milhares de registros para exibir um total. |
| Exportação montada no servidor | O arquivo sai pronto em `Content-Disposition`, sem passar todas as vendas pelo cliente. |
| Exclusão em cascata | Remover um usuário remove sessões, contas, cálculos, vendas e análises. |
| Um usuário por instalação | Escopo definido com a equipe: multiusuário e perfis ficaram fora da versão entregue. |

O documento detalhado está em [Visão Geral](./visao-geral.md).

---

## 9. Referências

| Documento | Conteúdo |
|---|---|
| [Visão Geral](./visao-geral.md) | Objetivo, escopo e atores |
| [Requisitos](./requisitos.md) | RF e RNF detalhados |
| [Regras de Negócio](./regras-de-negocio.md) | RN01–RN49 por módulo |
| [Motor de Precificação](./motor-de-precificacao.md) | Fórmulas, erros e vetores de teste |
| [Modelo de Dados (MER)](./modelo-de-dados-mer.md) | MER e mapeamento Prisma |
| [Arquitetura](./arquitetura.md) | Casos de uso, fluxo do cálculo e arquitetura técnica |
| [API REST](./api.md) | Endpoints, payloads, paginação e erros |
| [Rastreabilidade](./rastreabilidade.md) | RF × RN, código e cobertura de testes |
| [Configuração do Ambiente](./configuracao-ambiente.md) | Instalação, execução e troubleshooting |
