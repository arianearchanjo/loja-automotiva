# Motor de Precificação

> Referência técnica do cálculo de preço do Sistema de Gestão Comercial e Financeira.
> Implementação: [`backend/src/lib/precificacao.ts`](../backend/src/lib/precificacao.ts) —
> testes: [`backend/src/lib/precificacao.test.ts`](../backend/src/lib/precificacao.test.ts).
> Veja também: [API](./api.md), [Regras de Negócio](./regras-de-negocio.md),
> [Arquitetura](./arquitetura.md), 

## 1. Papel do módulo

`precificacao.ts` é a **fonte única da verdade** do cálculo de preço. Nenhuma outra
camada reimplementa essas fórmulas:

- as rotas (`backend/src/routes/`) apenas convertem HTTP ↔ objeto e persistem;
- o seed (`backend/prisma/seed.ts`) gera os dados de demonstração chamando o motor;
- o front-end **simula** chamando `POST /api/simulacoes/preco` — não calcula no
  navegador (RN44).

O módulo é **puro**: não importa Prisma, Express nem faz I/O. Isso o torna testável
unitariamente e reutilizável por qualquer camada.

## 2. Notação

| Símbolo | Campo | Tipo |
|---|---|---|
| `V` | `precoVenda` | valor monetário |
| `C` | `custoCompra` | valor monetário |
| `F` | `frete` | valor monetário |
| `t` | `taxaPlataformaPercentual` | percentual (0–100) |
| `d` | `descontoPlataforma` | percentual (0–100) |
| `i` | `impostoPercentual` | percentual (0–100) |
| `m` | `margemPercentual` | percentual (0–100, exclusive) |
| `tEf` | `taxaEfetivaPercentual` | **calculado** |

## 3. Decisão de regra: percentuais incidem sobre o preço de venda

O primeiro relato do cliente citava "imposto: R$ 10, taxa: R$ 10". O próprio cliente
esclareceu depois que *"a porcentagem e imposto devem ser considerados com base no valor
de venda, e não de custo"*. **Adotado: todos os percentuais incidem sobre `V` (preço de
venda), nunca sobre o custo de compra.** (RN43)

## 4. Taxa efetiva da plataforma

O desconto da plataforma só vale quando a **meta de venda foi atingida**:

```
tEf = metaVendaAlcancada ? max(t × (1 − d / 100), 0) : t
```

O piso em `0` garante que a taxa efetiva nunca fique negativa — a plataforma não "paga"
taxa ao vendedor. O desconto é **relativo**: com `t = 10%` e `d = 20%`, a taxa efetiva é
`8%` (e não `−10%`). (RN47, RN48)

Imposto e taxa são sempre calculados sobre o preço de venda:

```
imposto = V × i   / 100
taxa    = V × tEf / 100
```

## 5. Os três modos de cálculo

### 5.1 Modo `direto` — preço de venda conhecido → descobre o lucro

**Campos obrigatórios:** `precoVenda`, `custoCompra`, `margemPercentual`.

```
lucro        = V − C − F − imposto − taxa
margemObtida = lucro / V × 100
resultado    = lucro
```

### 5.2 Modo `reverso` — preço de venda conhecido → descobre o custo máximo

Diferencial do sistema: a partir do preço pretendido, responde "quanto posso gastar com
compra?". **Campos obrigatórios:** `precoVenda`, `frete`, `margemPercentual`.

```
custoMáximo = V − F − imposto − taxa − V × m / 100
```

Se `custoMáximo ≤ 0` → erro de negócio `MARGEM_IMPOSSIVEL`. O lucro e a margem
resultantes são recalculados sobre esse custo máximo, e `resultado = custoMaximo`.

### 5.3 Modo `vendaIdeal` — custo conhecido → descobre o melhor preço de venda

**Campos obrigatórios:** `custoCompra`, `frete`, `margemPercentual`.

Como imposto e taxa dependem do próprio `V`, a equação precisa ser isolada:

```
V − C − F − V×i/100 − V×tEf/100 = V×m/100
V × (1 − (i + tEf + m)/100)     = C + F
V = (C + F) / (1 − (i + tEf + m)/100)
```

- Se `i + tEf + m ≥ 100` → `MARGEM_IMPOSSIVEL` (não existe preço possível).
- O `V` calculado é **arredondado para cima** (2 casas) para nunca entregar menos
  margem que a pedida.
- Depois do arredondamento, imposto, taxa, lucro e margem são **recalculados** a partir
  do `V` final, para que os números exibidos fechem entre si (RN45, RN46).
- `resultado = precoVenda`.

## 6. Regras numéricas

| Regra | Comportamento |
|---|---|
| Campo ausente ou `null` | Tratado como `0` (RN44) |
| Percentual fora de 0–100 | `PERCENTUAIS_INVALIDOS` (RN49) |
| `V ≤ 0` nos modos `direto`/`reverso` | `PERCENTUAIS_INVALIDOS` |
| Divisão por zero | Impedida: erro de negócio, nunca `Infinity`/`NaN` (RN10) |
| Arredondamento | 2 casas decimais; `vendaIdeal` arredonda o `V` **para cima** |
| Campos derivados | `taxaEfetivaPercentual`, `valorImposto`, `valorTaxa`, `lucro`, `margemObtidaPercentual` e `resultado` **nunca** vêm do cliente (RN42) |

## 7. Erros de negócio

Lançados como `ErroPrecificacao`, com `codigo` estável:

| Código | Quando ocorre |
|---|---|
| `CAMPOS_INSUFICIENTES` | Falta campo obrigatório do modo escolhido (RN07, RN12) |
| `PERCENTUAIS_INVALIDOS` | Percentual fora de 0–100 ou preço de venda não positivo |
| `MARGEM_IMPOSSIVEL` | Percentuais somam 100% ou mais, ou não sobra valor para o custo |

As rotas convertem `ErroPrecificacao` em `HTTP 400`. O shape do corpo difere por rota e
está documentado em [API](./api.md).

## 8. Vetores de referência

Cobertos por `precificacao.test.ts` (13 casos), incluindo os números do cliente:

| Caso | Entrada | Resultado |
|---|---|---|
| A | `vendaIdeal`, C=100, F=15, t=10%, i=10%, m=5%, sem desconto | `V = 153.34`, imposto `15.33`, taxa `15.33`, lucro `7.68`, margem `5.01%` |
| B | idem + `d=20%` com meta atingida | `tEf = 8`, `V = 149.36`, imposto `14.94`, taxa `11.95`, lucro `7.47` |
| C | `d=20%` **sem** meta atingida | Idêntico ao caso A (desconto ignorado) |
| D | `direto`, V=420, C=280, F=25, t=12%, i=8% | imposto `33.6`, taxa `50.4`, lucro `31`, margem `7.38%` |
| E | `reverso`, V=620, F=35, t=11%, i=12%, m=20% | imposto `74.4`, taxa `68.2`, custo máximo `318.4` |
| F | `vendaIdeal`, t=60%, i=30%, m=20% | `MARGEM_IMPOSSIVEL` |
| G | `vendaIdeal` sem `frete` | `CAMPOS_INSUFICIENTES` |
| H | `t=5%`, `d=100%`, meta atingida | `tEf = 0` (nunca negativa) |
| I | `i=150%` | `PERCENTUAIS_INVALIDOS` |
| J | percentuais `null` | equivalentes a `0`, nenhum `NaN`/`Infinity` |

## 9. Uso no sistema

| Ponto de integração | Uso |
|---|---|
| `POST /api/simulacoes/preco` | Simulação sem gravação; alimenta a prévia da tela de cálculo |
| `POST /api/calculos` | Persiste entradas **e** derivados, sempre recalculados no servidor |
| `prisma/seed.ts` | Gera os 6 cálculos de demonstração pelo mesmo motor |
| `frontend/src/pages/NovoCalculo.tsx` | Consome a simulação com `debounce` de 250 ms e `AbortController` |

> O modelo `calculo_preco` guarda **todos** os percentuais como `Decimal(5, 2)` e os
> valores monetários como `Decimal(12, 4)`. O PostgreSQL devolve `Decimal` como **string**;
> por isso `frontend/src/lib/api.ts` tipa esses campos como `string | null`, enquanto a
> simulação (JSON puro) devolve `number`.
