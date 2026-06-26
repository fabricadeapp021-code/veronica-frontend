## Context

A página `/apps/agents` (`AgentsBody.jsx`) usa um layout de 3 seções empilhadas verticalmente antes dos cards dos agentes:
1. Header com título + botão "Contratar"
2. Row com 3 Bootstrap `Card` KPI (Total / Ativos / Pausados) — ~130px
3. Um `Card` separado apenas para o `InputGroup` de busca — ~60px

Com apenas 2 agentes, os cards já ficam bem abaixo do fold. Com dezenas de agentes futuros, a ausência de paginação forçaria scroll infinito. Todo o estado é local (`useState`) e os dados vêm de uma única query `GET /agents` já existente.

## Goals / Non-Goals

**Goals:**
- Eliminar os 2 blocos de espaço desperdiçado (KPI cards + search card) condensando-os no header
- Dar máxima área visual aos cards dos agentes
- Adicionar paginação client-side para suportar crescimento da lista sem mudança de API

**Non-Goals:**
- Paginação server-side (todos os agentes já são carregados; scope futuro se ultrapassar ~200 agentes)
- Mudanças em `AgentsSidebar.jsx` ou `AgentsHeader.jsx`
- Qualquer alteração de API ou backend
- Filtros avançados, ordenação, ou colunas configuráveis

## Decisions

### 1. Stats inline no header em vez de cards KPI separados

**Decisão**: Renderizar `X agentes · Y ativos · Z pausados` como texto pequeno abaixo do título `<h4>`, na mesma `div` de header.

**Alternativa considerada**: Manter os cards mas reduzir padding. Descartado — ainda ocupa uma Row inteira e não resolve o problema de altitude.

**Rationale**: Informação de contagem é contexto, não destaque. Remover os cards libera ~130px sem perda funcional.

---

### 2. Busca inline no header em vez de Card separado

**Decisão**: Mover o `InputGroup` de busca para a linha do header, entre os stats e o botão "Contratar", com `maxWidth: 280px`.

**Alternativa considerada**: Mover busca para a sidebar. Descartado — quebraria o padrão de layout do template Hogo e exigiria prop drilling.

**Rationale**: Libera ~60px adicionais e mantém busca visível sem scroll.

---

### 3. Paginação client-side com `useState`

**Decisão**: Fatiar `filteredAgents` com `slice((page-1)*PAGE_SIZE, page*PAGE_SIZE)` onde `PAGE_SIZE = 12`. Estado: `const [page, setPage] = useState(1)`. Resetar para 1 sempre que `search` mudar via `useEffect`.

**Alternativa considerada**: `PAGE_SIZE = 9` (múltiplo de 3 colunas). Descartado em favor de 12 (múltiplo de 2, 3 e 4 — funciona em todos os breakpoints `md=6, xl=4`).

**Rationale**: Zero custo de backend, zero latência extra, implementação em ~15 linhas.

## Risks / Trade-offs

- **[Risk] Todos os agentes carregados de uma vez** → Aceitável até ~500 agentes. Se crescer além disso, a query `/agents` precisará de `limit/offset`. Mitigação: adicionar paginação server-side como tarefa separada quando necessário.
- **[Risk] Busca + paginação simultâneas** → O reset de `page` para 1 via `useEffect([search])` evita mostrar uma página vazia. Mitigação: coberta pela implementação.
- **[Trade-off] Stats inline perdem destaque visual** → Aceitável; o produto é "força de trabalho de IA", não um dashboard de métricas. Os tenants querem ver e agir sobre seus agentes, não contar cards.
