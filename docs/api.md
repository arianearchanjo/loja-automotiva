# API REST

> Referência da API do Sistema de Gestão Comercial e Financeira.
> Implementação: [`backend/src/app.ts`](../backend/src/app.ts) e
> [`backend/src/routes/`](../backend/src/routes).
> Veja também: [Arquitetura](./arquitetura.md), [Motor de Precificação](./motor-de-precificacao.md),
> [Configuração do Ambiente](./configuracao-ambiente.md).

## 1. Base URL e transporte

| Item | Valor |
|---|---|
| URL da API | `http://localhost:3333` (definida por `PORT` no `backend/.env`) |
| Prefixo de negócio | `/api` |
| Formato | JSON (`Content-Type: application/json`) |
| CORS | Liberado apenas para `FRONTEND_URL`, com `credentials: true` |

Em desenvolvimento o front-end **não** usa a URL absoluta: o Vite faz proxy de `/api` para
`http://localhost:3333` ([`frontend/vite.config.ts`](../frontend/vite.config.ts)), e
`frontend/src/lib/api.ts` chama caminhos relativos (`/api/calculos`).

## 2. Autenticação

Todas as rotas de negócio exigem sessão válida (RN03, RN42). O `Better Auth` expõe seus
próprios endpoints sob `/api/auth/*`:

| Endpoint | Uso |
|---|---|
| `POST /api/auth/sign-in/email` | Login com e-mail e senha |
| `POST /api/auth/sign-out` | Logout |
| `GET /api/auth/get-session` | Sessão atual (usado por `authClient.useSession()`) |
| `POST /api/auth/sign-up/email` | Cadastro (usado pela seed; **sem tela**) |

Autenticação via **cookie de sessão** — todas as chamadas precisam de
`credentials: "include"`.

### Bloqueio por tentativas (RN02)

O middleware `loginGuard` ([`backend/src/lib/login-guard.ts`](../backend/src/lib/login-guard.ts))
conta as falhas **por e-mail**:

- 3 tentativas inválidas → bloqueio por **15 minutos**;
- resposta: `429` com
  `{ "message": "...", "code": "TOO_MANY_ATTEMPTS", "retryAfterMs": 900000 }`;
- um login bem-sucedido zera a contagem.

> O estado vive em memória do processo: reiniciar o servidor limpa a contagem e múltiplas
> instâncias não compartilham o bloqueio.

## 3. Convenções

- **Datas**: `criadoEm`, `dataVenda`, `periodoInicio` e `periodoFim` são ISO 8601
  (`2026-10-05T12:00:00.000Z`). Campos de data são aceitos em `YYYY-MM-DD` nas rotas de
  escrita, thanks ao `z.coerce.date()`.
- **Decimais**: campos vindos do PostgreSQL (`Decimal`) chegam como **string**. Só a
  simulação e os agregados devolvem `number`, por não virem direto das colunas `Decimal`.
- **Isolamento por usuário**: toda consulta é filtrada por `userId` da sessão. Não existe
  endpoint para acessar registro de outra conta (RN06, RN42).
- **Exclusão**: responde `204` sem corpo.

### Paginação

Nenhuma listagem carrega a tabela inteira. As rotas `GET` de `/api/calculos`,
`/api/vendas` e `/api/analises` aceitam:

| Parâmetro | Padrão | Regras |
|---|---|---|
| `pagina` | `1` | Inteiro ≥ 1 |
| `limite` | `20` | Inteiro entre 1 e 100 |

Parâmetro ausente, não numérico ou fora do intervalo cai no padrão, em vez de devolver
erro. A resposta é um envelope com a fatia e os metadados da página:

```json
{
  "dados": [{ "id": "...", "...": "..." }],
  "paginacao": { "pagina": 1, "limite": 20, "total": 137, "totalPaginas": 7 }
}
```

Totais e séries dos cards e gráficos vêm de endpoints de agregação
(`/api/calculos/resumo`, `/api/vendas/resumo`), calculados com `aggregate`, `count`,
`groupBy` e `date_trunc` no banco — não no navegador.

## 4. Formato de erro

| Situação | Status | Corpo |
|---|---|---|
| Falha de validação (Zod) em `/api/calculos`, `/api/vendas`, `/api/analises` | `400` | `{ "error": { "<campo>": ["mensagem"] } }` |
| Erro de negócio do cálculo em `/api/calculos` | `400` | `{ "error": { "tipo": ["mensagem"] } }` |
| Erro de validação (Zod) em `/api/simulacoes/preco` | `400` | `{ "error": { "<campo>": ["mensagem"] } }` |
| Erro de negócio do cálculo em `/api/simulacoes/preco` | `400` | `{ "error": "mensagem" }` |
| Não autenticado | `401` | `{ "error": "Não autenticado" }` |
| Registro inexistente ou de outro usuário | `404` | `{ "error": "Cálculo não encontrado" }` |
| Login bloqueado | `429` | `{ "message": "...", "code": "TOO_MANY_ATTEMPTS", "retryAfterMs": 900000 }` |

O front-end normaliza os dois formatos em
[`frontend/src/lib/api.ts`](../frontend/src/lib/api.ts) (`extrairMensagemErro`) para nunca
exibir `[object Object]` na tela (RN38).

## 5. Endpoints públicos

| Método | Rota | Resposta |
|---|---|---|
| `GET` | `/` | `{ "name": "Loja Automotiva API", "version": "1.0.0" }` |
| `GET` | `/health` | `{ "status": "ok", "env": "development" }` |

## 6. Cálculos de preço — `/api/calculos`

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/calculos` | Lista os cálculos do usuário, `criadoEm` decrescente. Aceita `pagina` e `limite` |
| `GET` | `/api/calculos/resumo` | Agregados dos cards: total, lucro acumulado, preço médio e quebra por tipo |
| `POST` | `/api/calculos` | Calcula e salva um cálculo → `201` |
| `GET` | `/api/calculos/:id` | Detalhe de um cálculo → `404` se não existir |
| `DELETE` | `/api/calculos/:id` | Exclui um cálculo → `204` |

### `GET /api/calculos/resumo` — resposta

```json
{
  "total": 137,
  "lucroTotal": "489.87",
  "precoTotal": "3330",
  "precoMedio": "555",
  "porTipo": [{ "tipo": "vendaIdeal", "total": 1 }]
}
```

### `POST /api/calculos` — entrada

```jsonc
{
  "nome": "Kit revisão 40k",          // 1–100 caracteres (RN14)
  "tipo": "direto",                  // "direto" | "reverso" | "vendaIdeal"
  "precoVenda": 420,                 // >= 0
  "custoCompra": 280,                // >= 0
  "frete": 25,                       // >= 0
  "taxaPlataformaPercentual": 12,    // 0–100
  "impostoPercentual": 8,            // 0–100
  "descontoPlataforma": 20,          // 0–100
  "metaVendaAlcancada": true,        // boolean ou "true"/"false"/"1"/"0"
  "margemPercentual": 15             // >= 0 e < 100
}
```

Campos **obrigatórios por tipo** (validados pela API e pelo motor — RN07, RN12):

| `tipo` | Obrigatórios |
|---|---|
| `direto` | `precoVenda`, `custoCompra`, `margemPercentual` |
| `reverso` | `precoVenda`, `frete`, `margemPercentual` |
| `vendaIdeal` | `custoCompra`, `frete`, `margemPercentual` |

O corpo de retorno é o registro completo de `calculo_preco`, incluindo os campos
**calculados no servidor**: `taxaEfetivaPercentual`, `valorImposto`, `valorTaxa`,
`lucro`, `margemObtidaPercentual` e `resultado`. Campos derivados enviados pelo cliente
são simplesmente ignorados (RN42).

`descontoPlataforma` só é gravado quando `metaVendaAlcancada` é `true`; caso contrário
fica `null`.

## 7. Simulação de preço — `/api/simulacoes`

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/simulacoes/preco` | Calcula **sem persistir** nada |

Aceita o mesmo payload de `POST /api/calculos`, **sem `nome`**. Retorna
`SaidaPrecificacao` com números (`number`, não string):

```json
{
  "taxaEfetivaPercentual": 12,
  "precoVenda": 420,
  "custoCompra": 280,
  "valorImposto": 33.6,
  "valorTaxa": 50.4,
  "lucro": 31,
  "margemObtidaPercentual": 7.38,
  "resultado": 31
}
```

É este endpoint que alimenta a prévia da tela de cálculos, com `debounce` de 250 ms e
`AbortController` no front-end. As fórmulas estão em
[Motor de Precificação](./motor-de-precificacao.md).

## 8. Vendas — `/api/vendas`

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/vendas` | Lista as vendas do usuário, `dataVenda` decrescente. Aceita `pagina`, `limite`, `periodoInicio` e `periodoFim` |
| `GET` | `/api/vendas/resumo` | Agregados do período: totais, margem, ticket médio e série mensal |
| `GET` | `/api/vendas/exportar` | Baixa o período em CSV ou JSON (`formato=csv\|json`) |
| `POST` | `/api/vendas` | Registra uma venda → `201` |
| `GET` | `/api/vendas/:id` | Detalhe de uma venda → `404` |
| `DELETE` | `/api/vendas/:id` | Exclui uma venda → `204` |

### `POST /api/vendas` — entrada

```json
{
  "receita": 1250.9,
  "custoTotal": 780.4,
  "dataVenda": "2026-10-05"
}
```

`lucroBruto` **não é informado**: é calculado no servidor como
`receita − custoTotal` (RN26).

### `GET /api/vendas/resumo` — resposta

```json
{
  "periodo": { "periodoInicio": "2026-08-01T00:00:00.000Z", "periodoFim": "2026-09-30T23:59:59.000Z" },
  "quantidade": 8,
  "receita": 28750,
  "custo": 17850,
  "lucro": 10900,
  "margem": 37.913043478260875,
  "ticketMedio": 3593.75,
  "porMes": [{ "mes": "2026-09", "receita": 18300, "custo": 11240, "lucro": 7060 }]
}
```

Sem `periodoInicio`/`periodoFim`, agrega todo o histórico. Todos os valores do resumo saem
como `number` (o `Decimal` do PostgreSQL já é convertido), então chegam prontos para o
Recharts.

### `GET /api/vendas/exportar` — resposta

Não devolve JSON com envelope: responde o próprio arquivo, com
`Content-Disposition: attachment; filename="vendas-YYYY-MM-DD.csv"` (ou `.json`). O CSV sai
com BOM UTF-8 para o Excel abrir corretamente. Como o download é uma navegação direta, o
cookie de sessão é enviado normalmente pelo navegador.

## 9. Análises financeiras — `/api/analises`

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/analises` | Lista as análises do usuário, `criadoEm` decrescente. Aceita `pagina` e `limite` |
| `POST` | `/api/analises` | Agrega as vendas do período e salva o snapshot → `201` |
| `GET` | `/api/analises/:id` | Detalhe de uma análise → `404` |
| `DELETE` | `/api/analises/:id` | Exclui uma análise → `204` |

### `POST /api/analises` — entrada

```json
{
  "periodoInicio": "2026-10-01",
  "periodoFim": "2026-10-31"
}
```

O servidor soma `receita`, `custoTotal` e `lucroBruto` das vendas do usuário dentro da
janela e grava `receitaTotal`, `custoTotal` e `lucroTotal` (RN24, RN25).

## 10. Métodos suportados por entidade

| Entidade | Métodos |
|---|---|
| `/api/auth/*` | Better Auth: sign-up, sign-in, sign-out e sessão |
| `/api/calculos` | `GET` (paginado), `POST`, `DELETE /:id` |
| `/api/analises` | `GET` (paginado), `POST`, `DELETE /:id` |
| `/api/vendas` | `GET` (paginado), `POST` |
| `/api/simulacoes/preco` | `POST` |

A entidade é criada, listada e excluída; não há `PUT`/`PATCH`, porque um cálculo salvo é um
registro de decisão de preço e a análise é um snapshot do período — alterar qualquer um
desses valores significa gravar um novo registro. O relatório de performance é gerado a
partir de `/api/vendas/resumo` e `/api/vendas/exportar`, sem tabela própria. 
