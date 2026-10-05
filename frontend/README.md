# Front-end — Loja Automotiva

SPA em **React 18 + Vite + TypeScript**, com **Tailwind CSS 4** e **Recharts**.

## Pré-requisitos

- Node.js >= 20
- Back-end rodando em `http://localhost:3333` (a API é o proxy `/api` do Vite)

## Instalação

O repositório usa **npm workspaces**: basta rodar `npm install` na raiz. Para trabalhar só
neste pacote:

```bash
npm install
cp .env.example .env   # opcional; ajuste VITE_API_URL se a API não estiver na 3333
```

## Scripts

| Script | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento do Vite (porta 5173) |
| `npm run build` | Verifica tipos e gera o bundle de produção em `dist/` |
| `npm run preview` | Serve o build de produção |
| `npm run typecheck` | Verificação de tipos (`tsc --noEmit`) |

> Este pacote não tem `lint`, `format` nem `test`: o padrão de qualidade da equipe está
> concentrado no back-end.

## Proxy da API

`vite.config.ts` encaminha `/api` para o back-end, então o app consome caminhos
relativos (`/api/calculos`) e não há CORS em desenvolvimento:

```ts
server: {
  port: 5173,
  proxy: { "/api": { target: "http://localhost:3333", changeOrigin: true } },
}
```

A única exceção é o cliente do Better Auth (`src/lib/auth-client.ts`), que usa a URL
absoluta de `VITE_API_URL` porque o hook de sessão precisa falar direto com a API.

## Estrutura

```
frontend/
├── index.html
├── vite.config.ts
└── src/
    ├── main.tsx                  # ponto de entrada
    ├── App.tsx                   # rotas + proteção de sessão
    ├── index.css                 # Tailwind 4 + tokens do tema dark (@theme)
    ├── components/
    │   ├── Layout.tsx            # shell: sidebar, header, logout
    │   ├── ProtectedRoute.tsx    # (não utilizado — ver observação abaixo)
    │   └── ui.tsx                # kit de design: Card, Button, Field, Badge, Stat...
    ├── lib/
    │   ├── api.ts                # tipos, wrapper fetch e namespaces da API
    │   ├── auth-client.ts        # createAuthClient (Better Auth)
    │   ├── auth.tsx              # AuthProvider / useAuth
    │   └── format.ts             # formatBRL, formatDate, formatPercent
    └── pages/
        ├── Login.tsx             # login (tratativa de 429 por tentativas)
        ├── Dashboard.tsx         # KPIs + evolução mensal + últimos registros
        ├── Calculos.tsx          # listagem dos cálculos + exclusão
        ├── NovoCalculo.tsx       # formulário de novo cálculo (3 modos)
        ├── Vendas.tsx            # registro de vendas
        ├── Analises.tsx          # análises por período
        └── Relatorios.tsx        # relatório de performance + exportação CSV/JSON
```

> ⚠️ `src/components/ProtectedRoute.tsx` está **fora de uso**: o guard real é o componente
> local `ProtectedRoute` dentro de `src/App.tsx`, que renderiza `<Layout>`. O arquivo
> sobrou de uma versão anterior e pode ser removido.

## Rotas

| Rota | Tela | Acesso |
|---|---|---|
| `/login` | Login | Público (redireciona para `/` se já autenticado) |
| `/` | Dashboard | Protegida |
| `/calculos` | Listagem de cálculos | Protegida |
| `/calculos/novo` | Novo cálculo | Protegida |
| `/vendas` | Vendas | Protegida |
| `/analises` | Análises financeiras | Protegida |
| `/relatorios` | Relatórios | Protegida |
| `*` | Redireciona para `/` | — |

## Cálculo de preço em tempo real

A tela de novo cálculo **não calcula nada no navegador**. A cada alteração de campo
(chave ou vírgula decimal), um `useEffect` com `debounce` de 250 ms e `AbortController`
chama `POST /api/simulacoes/preco`, e o motor no back-end devolve o resultado. Assim o
usuário vê o preço, o lucro, a margem e o detalhamento enquanto digita, e o valor
exibido é o mesmo que será salvo.

Detalhes das fórmulas em [`../docs/motor-de-precificacao.md`](../docs/motor-de-precificacao.md).

## Estado e formatação

- **Sem biblioteca de estado global.** Cada tela usa `useState`/`useMemo`; o único
  contexto React é o de autenticação (`AuthProvider`).
- **Decimais:** todos os campos numéricos aceitam vírgula ou ponto decimal e são
  normalizados antes de virar `number`.
- **Dinheiro e percentuais:** `src/lib/format.ts` centraliza `formatBRL` (pt-BR) e
  `formatPercent`.
- **`Decimal` do PostgreSQL chega como `string`** nas respostas; por isso os tipos em
  `lib/api.ts` usam `string | null` para valores e percentuais, e `number` apenas para a
  saída da simulação.
