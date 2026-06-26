## Why

A página `/apps/agents` empurra os cards dos agentes para baixo do fold por causa de dois blocos que consomem espaço desnecessário: 3 cards KPI grandes (Total / Ativos / Pausados) e uma barra de busca encapsulada em um `Card` separado. Tenants precisam rolar para ver seus agentes, prejudicando a experiência central do produto — a força de trabalho de IA.

## What Changes

- Substituir os 3 cards KPI grandes por uma linha de estatísticas inline compacta no header da página (`2 agentes · 2 ativos · 0 pausados`)
- Mover o campo de busca para dentro da linha do header, eliminando o `Card` container separado
- Adicionar paginação client-side na grade de agentes (12 por página, com controles Anterior / Página X de Y / Próxima)
- Resetar a página para 1 quando o termo de busca mudar

## Capabilities

### New Capabilities

- `agents-page-pagination`: Paginação client-side da lista de agentes com tamanho de página configurável e reset automático ao buscar

### Modified Capabilities

- (nenhuma mudança em requisitos de especificação existentes — apenas refactor de layout e adição de paginação)

## Impact

- **Arquivo afetado**: `openclaw-frontend/src/app/(apps layout)/apps/agents/AgentsBody.jsx` (linhas 1970–2173)
- **Sem mudanças de API**: todos os dados já são carregados em uma única query; a paginação é puramente client-side sobre o array `filteredAgents`
- **Sem mudanças de backend**: nenhum endpoint novo ou modificado
- **Sem mudanças em outros componentes**: `AgentsSidebar.jsx` e `AgentsHeader.jsx` não são afetados
