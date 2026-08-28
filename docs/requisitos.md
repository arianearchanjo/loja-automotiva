# Requisitos

> Parte da documentação do Sistema de Gestão Comercial e Financeira.
> Veja também: [Visão Geral](./visao-geral.md), [Regras de Negócio](./regras-de-negocio.md),
> [Modelo de Dados (MER)](./modelo-de-dados-mer.md), [Arquitetura](./arquitetura.md),
> [Roadmap](./roadmap.md).

## 3. Requisitos Funcionais (RF)

Requisitos reorganizados por módulo, com prioridade sugerida (MoSCoW) para orientar o
desenvolvimento incremental.

### 3.1 Módulo — Acesso e Dashboard

| ID | Requisito | Prioridade |
|---|---|---|
| RF01 | O sistema deve permitir que o usuário faça **login** e **logout**. | Must |
| RF02 | O sistema deve exibir um **dashboard** dinâmico, interativo e personalizável, como tela inicial pós-login. | Must |

### 3.2 Módulo — Gestão de Vendas (Cálculo de Preço)

| ID | Requisito | Prioridade |
|---|---|---|
| RF03 | O usuário deve poder **cadastrar cálculos** de preço, que ficam salvos no sistema. | Must |
| RF04 | O usuário deve poder **inserir valores** (custo, frete, taxas, margem desejada etc.) e obter o **resultado calculado**. | Must |
| RF04.1 | O sistema deve oferecer o modo de **cálculo reverso**: a partir do preço de venda informado, calcular o valor máximo disponível para compra, frete, taxas e demais despesas. | Must |
| RF05 | O usuário deve poder **consultar o histórico** de cálculos realizados. | Must |
| RF06 | O usuário deve poder **excluir** um cálculo do histórico. | Must |
| RF07 | O usuário deve poder **gerar um relatório** (arquivo) com os resultados de um cálculo. | Should |

### 3.3 Módulo — Gestão Financeira

| ID | Requisito | Prioridade |
|---|---|---|
| RF08 | O usuário deve poder **registrar dados de vendas** (ex.: receita, lucro bruto, custos). | Should |
| RF09 | O usuário deve poder **visualizar análises** dos dados financeiros inseridos (receitas, custos, lucros). | Should |
| RF10 | O usuário deve poder **consultar o histórico** de análises financeiras. | Should |
| RF11 | O usuário deve poder **excluir** uma análise financeira. | Should |
| RF12 | O usuário deve poder **gerar um relatório** com os resultados de uma análise financeira. | Could |

### 3.4 Módulo — Configurações e Informações Gerais

| ID | Requisito | Prioridade |
|---|---|---|
| RF13 | O usuário deve poder acessar **configurações** básicas do sistema. | Should |
| RF14 | O usuário deve poder visualizar **contato/notas dos desenvolvedores**. | Could |
| RF15 | O sistema deve exibir o **tempo de uso** do usuário. | Could |
| RF16 | O sistema deve exibir a **versão** atual do sistema. | Could |

## 4. Requisitos Não Funcionais (RNF)

| ID | Categoria | Requisito |
|---|---|---|
| RNF01 | Segurança | Senhas devem ser armazenadas com hash (via Better Auth); sessões devem expirar por inatividade (RN05). |
| RNF02 | Segurança | Toda comunicação entre front-end e API deve ocorrer via HTTPS em produção. |
| RNF03 | Validação | Toda entrada de dados no back-end deve ser validada com Zod antes de persistência (defesa em profundidade, além da validação de front-end). |
| RNF04 | Usabilidade | O dashboard deve ser responsivo (desktop e mobile), usando Tailwind CSS. |
| RNF05 | Desempenho | Cálculos (diretos e reversos) devem retornar resultado em até 1s em condições normais de uso. |
| RNF06 | Confiabilidade | Falhas de conexão ou do sistema não devem corromper ou apagar dados já persistidos (RN57, RN64). |
| RNF07 | Manutenibilidade | O código deve seguir padronização via ESLint + Prettier e ter cobertura de testes automatizados (Vitest) para as regras de cálculo. |
| RNF08 | Portabilidade de dados | Relatórios devem poder ser exportados em PDF (jsPDF) e Excel/CSV (ExcelJS). |
| RNF09 | Auditabilidade | Operações relevantes (criação, exclusão) devem registrar usuário, data e hora (RN62). |
