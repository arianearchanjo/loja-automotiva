# Regras de Negócio (RN)

> Parte da documentação do Sistema de Gestão Comercial e Financeira.
> Veja também: [Visão Geral](./visao-geral.md), [Requisitos](./requisitos.md),
> [Modelo de Dados (MER)](./modelo-de-dados-mer.md), [Arquitetura](./arquitetura.md),
> [Rastreabilidade](./rastreabilidade.md), [Motor de Precificação](./motor-de-precificacao.md).

Regras de negócio do sistema, organizadas por módulo e numeradas sequencialmente de
**RN01** a **RN49**. O detalhamento das fórmulas de cálculo está em
[Motor de Precificação](./motor-de-precificacao.md); o vínculo entre requisito e regra está
em [Rastreabilidade](./rastreabilidade.md).

## RN01–RN06 — Acesso e autenticação

| ID | Regra |
|---|---|
| RN01 | O acesso ao sistema exige login e senha válidos. |
| RN02 | Após três tentativas inválidas, o login é bloqueado temporariamente por 15 minutos. |
| RN03 | Somente usuários autenticados acessam as funções do sistema. |
| RN04 | O logout encerra a sessão e retorna à tela de login. |
| RN05 | A sessão expira após 7 dias e é renovada a cada 24 horas de atividade. |
| RN06 | Cada usuário visualiza somente os próprios dados. |

## RN07–RN21 — Gestão de vendas e cálculos

| ID | Regra |
|---|---|
| RN07 | Todos os campos obrigatórios devem ser preenchidos. |
| RN08 | Campos numéricos aceitam somente números válidos. |
| RN09 | O sistema aceita e padroniza vírgula ou ponto decimal. |
| RN10 | Operações inválidas, como divisão por zero, são impedidas. |
| RN11 | Valores negativos são aceitos somente quando permitidos pelo contexto. |
| RN12 | Os valores são validados antes do cálculo. |
| RN13 | Cada cálculo possui identificação, valores, resultado, data e hora. |
| RN14 | O nome do cálculo respeita um limite de 80 caracteres. |
| RN15 | O sistema informa o sucesso ou a falha do salvamento. |
| RN16 | O sistema impede salvamento duplicado por cliques repetidos. |
| RN17 | O histórico mostra somente os cálculos do usuário autenticado. |
| RN18 | O sistema informa quando o histórico está vazio. |
| RN19 | A exclusão exige confirmação e é permanente. |
| RN20 | Cancelar ou fechar a confirmação não exclui o cálculo. |
| RN21 | Após a exclusão, o histórico é atualizado. |

## RN22–RN32 — Gestão financeira

| ID | Regra |
|---|---|
| RN22 | Os dados financeiros obrigatórios devem ser preenchidos. |
| RN23 | Valores financeiros são exibidos no formato monetário. |
| RN24 | Toda análise deve indicar o período considerado. |
| RN25 | Resultados possíveis são calculados automaticamente. |
| RN26 | O sistema diferencia dados informados de dados calculados. |
| RN27 | Somente análises válidas podem ser salvas. |
| RN28 | Cada análise possui identificação, período, data e resultados. |
| RN29 | Cada usuário visualiza somente as próprias análises. |
| RN30 | Valores monetários são exibidos com duas casas decimais. |
| RN31 | A exclusão de uma análise exige confirmação. |
| RN32 | Excluir uma análise não exclui os dados de vendas associados. |

## RN33–RN42 — Proteção geral e integridade dos dados

| ID | Regra |
|---|---|
| RN33 | Botões de exclusão têm destaque visual. |
| RN34 | Nenhum registro é excluído sem confirmação. |
| RN35 | Falhas no sistema não devem apagar dados já salvos. |
| RN36 | Envios repetidos do mesmo formulário são impedidos. |
| RN37 | Campos obrigatórios e seus erros são identificados visualmente. |
| RN38 | Mensagens de erro não exibem informações internas do sistema. |
| RN39 | Operações importantes são registradas com usuário e data. |
| RN40 | Um registro é considerado salvo somente após a confirmação. |
| RN41 | Falhas de conexão não apagam dados já armazenados. |
| RN42 | Um usuário não pode acessar registros de outra conta. |

## RN43–RN49 — Motor de precificação

Regras do motor de cálculo, implementadas em
[`backend/src/lib/precificacao.ts`](../backend/src/lib/precificacao.ts) e cobertas por testes
unitários em [`precificacao.test.ts`](../backend/src/lib/precificacao.test.ts).

| ID | Regra |
|---|---|
| RN43 | Todo percentual — imposto, taxa da plataforma e margem — incide sobre o **preço de venda**, nunca sobre o custo de compra. |
| RN44 | Campo numérico ausente ou nulo é tratado como zero. |
| RN45 | O preço de venda da venda ideal é arredondado **para cima**, para nunca entregar menos margem que a pedida. |
| RN46 | Imposto, taxa, lucro e margem são recalculados a partir do preço de venda final, para que os números exibidos fechem entre si. |
| RN47 | O desconto da taxa da plataforma só se aplica quando a **meta de venda foi atingida**. |
| RN48 | A taxa efetiva nunca é negativa: desconto maior que a taxa resulta em taxa efetiva zero. |
| RN49 | Percentuais informados devem ficar entre 0 e 100. |

> Detalhamento das fórmulas, dos erros de negócio e dos vetores de teste em
> [Motor de Precificação](./motor-de-precificacao.md).