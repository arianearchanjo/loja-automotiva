# Documentação — Loja Automotiva

Esta pasta reúne a documentação do **Sistema de Gestão Comercial e Financeira**,
organizada em partes para facilitar a consulta e manutenção.

## Leitura recomendada

| Se você quer… | Comece por |
|---|---|
| Entender o negócio e o escopo | [Visão Geral](./visao-geral.md) |
| Entender a fórmula de cálculo | [Motor de Precificação](./motor-de-precificacao.md) |
| Consumir a API | [API REST](./api.md) |
| Rodar o projeto | [Configuração do Ambiente](./configuracao-ambiente.md) |
| Ver onde cada regra foi implementada | [Rastreabilidade](./rastreabilidade.md) |

## Documentos

### Entendimento do sistema

| Documento | Conteúdo |
|---|---|
| [Visão Geral](./visao-geral.md) | Objetivo, escopo, stakeholders e atores |
| [Requisitos](./requisitos.md) | Requisitos funcionais (RF) e não funcionais (RNF) |
| [Regras de Negócio](./regras-de-negocio.md) | Regras RN01–RN49, agrupadas por módulo |

### Modelagem e arquitetura

| Documento | Conteúdo |
|---|---|
| [Modelo de Dados (MER)](./modelo-de-dados-mer.md) | MER, decisões de modelagem e mapeamento Prisma |
| [Arquitetura](./arquitetura.md) | Casos de uso, fluxo do cálculo, arquitetura técnica e telas |
| [Rastreabilidade](./rastreabilidade.md) | Matriz RF × RN, cobertura de testes e onde cada regra vive no código |

### Referência técnica

| Documento | Conteúdo |
|---|---|
| [Motor de Precificação](./motor-de-precificacao.md) | Fórmulas dos três modos, decisões de regra, erros e vetores de teste |
| [API REST](./api.md) | Endpoints, payloads, paginação, convenções e formatos de erro |
| [Configuração do Ambiente](./configuracao-ambiente.md) | Pré-requisitos, instalação, execução e solução de problemas |
| [Especificação Consolidada](./especificacao-requisitos-sistema-comercial.md) | Documento único com todas as seções acima |

### Pacotes

| Documento | Conteúdo |
|---|---|
| [`backend/README.md`](../backend/README.md) | Estrutura, scripts, endpoints e testes do back-end |
| [`frontend/README.md`](../frontend/README.md) | Estrutura, rotas, proxy e decisões do front-end |

## O que o sistema faz

Autenticação com bloqueio por tentativas, dashboard com indicadores e evolução mensal,
cálculo de preço em três modos com prévia em tempo real, histórico paginado de cálculos,
registro de vendas, análises financeiras por período e relatório de performance com
exportação em CSV e JSON.

> A especificação consolidada é a fonte original completa. Os demais arquivos
> seccionam esse conteúdo para leitura focada por tema e são mantidos em sincronia com o
> código.