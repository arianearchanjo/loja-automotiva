# Requisitos

> Parte da documentação do Sistema de Gestão Comercial e Financeira.
> Veja também: [Visão Geral](./visao-geral.md), [Regras de Negócio](./regras-de-negocio.md),
> [Modelo de Dados (MER)](./modelo-de-dados-mer.md), [Arquitetura](./arquitetura.md),
> [Rastreabilidade](./rastreabilidade.md), [Motor de Precificação](./motor-de-precificacao.md).

Os requisitos do sistema, organizados por módulo. O vínculo entre requisito e regra de
negócio está em [Rastreabilidade](./rastreabilidade.md).

## Requisitos Funcionais (RF)

### Acesso e dashboard

| ID | Requisito |
|---|---|
| RF01 | O sistema deve permitir que o usuário faça **login** e **logout**. |
| RF02 | O sistema deve exibir um **dashboard** interativo com indicadores de desempenho e evolução de vendas, como tela inicial pós-login. |
| RF03 | O usuário deve poder **registrar vendas** (receita, custo e lucro). |
| RF04 | O usuário deve poder **visualizar análises financeiras** dos dados registrados, com receitas, custos, margens e lucro por período. |

### Gestão de vendas (cálculo de preço)

| ID | Requisito |
|---|---|
| RF05 | O usuário deve poder **cadastrar cálculos** de preço, que ficam salvos no sistema. |
| RF06 | O usuário deve poder **inserir valores** (custo, frete, taxas, margem desejada etc.) e obter o **resultado calculado**. |
| RF07 | O sistema deve oferecer o modo de **cálculo direto**: a partir do custo de compra, frete e percentuais, calcular o preço de venda mínimo para a margem desejada. |
| RF08 | O sistema deve oferecer o modo de **cálculo reverso**: a partir do preço de venda informado, calcular o valor máximo disponível para compra, frete, taxas e demais despesas. |
| RF09 | O sistema deve oferecer o modo de **venda ideal**: a partir do custo de compra, frete e percentuais, calcular o preço de venda que entrega a maior margem possível. |
| RF10 | O resultado do cálculo deve ser **previsto em tempo real** enquanto o usuário preenche o formulário, sem gravar nada. |
| RF11 | O usuário deve poder **consultar o histórico** de cálculos realizados. |
| RF12 | O usuário deve poder **excluir** um cálculo do histórico. |

> **Decisão de regra.** Todos os percentuais — imposto, taxa da plataforma e margem —
> incidem sobre o **preço de venda**, nunca sobre o custo de compra. Com isso os modos se
> unificaram: `vendaIdeal` é a inversão de `reverso`. As fórmulas estão em
> [Motor de Precificação](./motor-de-precificacao.md).

### Relatórios

| ID | Requisito |
|---|---|
| RF13 | O usuário deve poder **consultar o histórico** de análises financeiras. |
| RF14 | O usuário deve poder **excluir** uma análise financeira. |
| RF15 | O usuário deve poder **gerar relatório** de performance com receitas, custos, despesas, taxes, margem, lucro e preço médio de venda. |
| RF16 | O relatório deve ser **exportável** em CSV e JSON. |

## Requisitos Não Funcionais (RNF)

| ID | Categoria | Requisito |
|---|---|---|
| RNF01 | Segurança | Senhas devem ser armazenadas com hash (via Better Auth) e a sessão deve expirar por inatividade (RN05). |
| RNF02 | Validação | Toda entrada de dados no back-end deve ser validada com Zod antes da persistência, em defesa à profundidade da validação de front-end. |
| RNF03 | Usabilidade | A interface deve ser responsiva (desktop e mobile), construída com Tailwind CSS. |
| RNF04 | Desempenho | O cálculo deve retornar resultado em até 1 s em condições normais de uso. |
| RNF05 | Confiabilidade | Falhas de conexão ou do sistema não devem corromper ou apagar dados já persistidos (RN35, RN41). |
| RNF06 | Manutenibilidade | O código deve seguir padronização via ESLint + Prettier e ter cobertura de testes automatizados (Vitest) para o motor de cálculo. |
| RNF07 | Portabilidade de dados | Os relatórios devem ser exportáveis em CSV e JSON. |
| RNF08 | Auditabilidade | Criação e exclusão de registros devem carregar o usuário responsável e a data/hora (RN39). |