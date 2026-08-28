# Regras de Negócio (RN)

> Parte da documentação do Sistema de Gestão Comercial e Financeira.
> Veja também: [Visão Geral](./visao-geral.md), [Requisitos](./requisitos.md),
> [Modelo de Dados (MER)](./modelo-de-dados-mer.md), [Arquitetura](./arquitetura.md),
> [Roadmap](./roadmap.md).

Regras de negócio organizadas por módulo, preservando a numeração original do levantamento.

## 5.1 Menu inicial e acesso

| ID | Regra |
|---|---|
| RN01 | O acesso ao sistema exige login e senha válidos. |
| RN02 | Após três tentativas inválidas, o login é bloqueado temporariamente. |
| RN03 | Somente usuários autenticados acessam as funções do sistema. |
| RN04 | O logout encerra a sessão e retorna à tela de login. |
| RN05 | A sessão é encerrada após um período sem atividade. |
| RN06 | Cada usuário visualiza somente os próprios dados. |
| RN07 | Personalizações válidas do dashboard são salvas. |
| RN08 | Elementos essenciais do dashboard não podem ser removidos. |

## 5.2 Gestão de vendas e cálculos

| ID | Regra |
|---|---|
| RN09 | Todos os campos obrigatórios devem ser preenchidos. |
| RN10 | Campos numéricos aceitam somente números válidos. |
| RN11 | O sistema aceita e padroniza vírgula ou ponto decimal. |
| RN12 | Operações inválidas, como divisão por zero, são impedidas. |
| RN13 | Valores negativos são aceitos somente quando permitidos pelo contexto. |
| RN14 | Os valores são validados antes do cálculo. |
| RN15 | Cada cálculo possui identificação, valores, resultado, data e hora. |
| RN16 | O nome do cálculo respeita um limite de caracteres. |
| RN17 | O sistema informa o sucesso ou a falha do salvamento. |
| RN18 | O sistema impede salvamento duplicado por cliques repetidos. |
| RN19 | O histórico mostra somente os cálculos do usuário autenticado. |
| RN20 | O sistema informa quando o histórico está vazio. |
| RN21 | A exclusão exige confirmação e é permanente. |
| RN22 | Cancelar ou fechar a confirmação não exclui o cálculo. |
| RN23 | Após a exclusão, o histórico é atualizado. |
| RN24 | Cálculos vinculados a análises não podem ser excluídos. |
| RN25 | Somente cálculos válidos podem gerar relatórios. |
| RN26 | O relatório mostra valores, resultado, usuário, data e hora. |
| RN27 | Falhas no relatório não alteram o cálculo original. |

## 5.3 Gestão financeira

| ID | Regra |
|---|---|
| RN28 | Os dados financeiros obrigatórios devem ser preenchidos. |
| RN29 | Valores financeiros são exibidos no formato monetário. |
| RN30 | A data final não pode ser anterior à data inicial. |
| RN31 | Toda análise deve indicar o período considerado. |
| RN32 | Resultados possíveis são calculados automaticamente. |
| RN33 | O sistema diferencia dados informados de dados calculados. |
| RN34 | Somente análises válidas podem ser salvas. |
| RN35 | Cada análise possui identificação, período, data e resultados. |
| RN36 | Alterações nos dados exigem o recálculo da análise. |
| RN37 | Cada usuário visualiza somente suas próprias análises. |
| RN38 | Valores monetários são exibidos com duas casas decimais. |
| RN39 | A exclusão de uma análise exige confirmação. |
| RN40 | Excluir uma análise não exclui os dados de vendas associados. |
| RN41 | O relatório financeiro exibe dados, período e resultados. |
| RN42 | Análises incompletas não podem gerar relatórios. |
| RN43 | O relatório informa que os resultados dependem dos dados inseridos. |

## 5.4 Configurações e informações gerais

| ID | Regra |
|---|---|
| RN44 | O usuário altera somente configurações permitidas. |
| RN45 | Alterações importantes exigem confirmação. |
| RN46 | O usuário pode restaurar as configurações originais. |
| RN47 | Configurações inválidas são substituídas pelas configurações padrão. |
| RN48 | As notas do desenvolvedor são apenas para consulta. |
| RN49 | Somente contatos autorizados do desenvolvedor são exibidos. |
| RN50 | O tempo de uso é contado entre login e logout. |
| RN51 | O sistema diferencia o tempo atual do tempo total de uso. |
| RN52 | Períodos prolongados sem atividade não são contabilizados no tempo de uso. |
| RN53 | A versão do sistema não pode ser alterada pelo usuário. |
| RN54 | A versão segue um padrão de numeração semântica (ex.: 1.0.0). |

## 5.5 Regras gerais de proteção

| ID | Regra |
|---|---|
| RN55 | Botões de exclusão têm destaque visual. |
| RN56 | Nenhum registro é excluído sem confirmação. |
| RN57 | Falhas no sistema não devem apagar dados já salvos. |
| RN58 | O sistema avisa sobre alterações não salvas antes da saída. |
| RN59 | Envios repetidos do mesmo formulário são impedidos. |
| RN60 | Campos obrigatórios e seus erros são identificados visualmente. |
| RN61 | Mensagens de erro não exibem informações internas do sistema. |
| RN62 | Operações importantes são registradas com usuário e data. |
| RN63 | Um registro é considerado salvo somente após a confirmação. |
| RN64 | Falhas de conexão não apagam dados já armazenados. |
| RN65 | Um usuário não pode acessar registros de outra conta. |
