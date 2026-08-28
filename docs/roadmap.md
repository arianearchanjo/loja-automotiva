# Roadmap e Rastreabilidade

> Parte da documentação do Sistema de Gestão Comercial e Financeira.
> Veja também: [Visão Geral](./visao-geral.md), [Requisitos](./requisitos.md),
> [Regras de Negócio](./regras-de-negocio.md), [Modelo de Dados (MER)](./modelo-de-dados-mer.md),
> [Arquitetura](./arquitetura.md).

## 7. Rastreabilidade — Requisitos × Regras de Negócio

| Requisito Funcional | Regras de negócio relacionadas |
|---|---|
| RF01 (Login/Logout) | RN01–RN06 |
| RF02 (Dashboard) | RN07, RN08 |
| RF03–RF04 (Cadastrar/Calcular) | RN09–RN18 |
| RF04.1 (Cálculo reverso) | RN09–RN14 |
| RF05 (Histórico de cálculos) | RN19, RN20 |
| RF06 (Excluir cálculo) | RN21–RN24, RN55–RN57 |
| RF07 (Relatório de cálculo) | RN25–RN27 |
| RF08–RF09 (Vendas/Análise) | RN28–RN33 |
| RF10 (Histórico de análises) | RN34, RN37 |
| RF11 (Excluir análise) | RN39, RN40 |
| RF12 (Relatório financeiro) | RN41–RN43 |
| RF13 (Configurações) | RN44–RN47 |
| RF14 (Contato/notas) | RN48, RN49 |
| RF15–RF16 (Tempo de uso/versão) | RN50–RN54 |
| Transversal (todos) | RN58–RN65 |

## 8. Roadmap Sugerido

| Fase | Escopo |
|---|---|
| **MVP** | RF01, RF02, RF03, RF04, RF04.1, RF05, RF06 — núcleo de autenticação e cálculo (direto + reverso), com validações essenciais (RN01–RN27). |
| **v1.1** | RF07 (relatórios de cálculo), RF13 (configurações básicas). |
| **v1.2** | RF08, RF09, RF10, RF11 — módulo financeiro. |
| **v1.3** | RF12 (relatórios financeiros), RF14, RF15, RF16. |
| **Futuro** | Multiusuário, integrações com marketplaces, notificações, projeções e comparativos avançados. |

## 9. Pontos em Aberto para a Equipe

1. Definir as fórmulas exatas do cálculo direto e do cálculo reverso (depende das planilhas do usuário-alvo, ainda a serem coletadas).
2. Definir o conjunto de campos obrigatórios de "dados de venda" (RF08) — ex.: quais categorias de custo compõem o custo total.
3. Definir regra de bloqueio de login (RN02): tempo de bloqueio e se há reset por e-mail.
4. Confirmar se `RELATORIO` deve ser persistido (histórico de exportações) ou gerado sob demanda sem registro em banco.
5. Detalhar as "personalizações válidas do dashboard" (RN07) — quais widgets são configuráveis.
