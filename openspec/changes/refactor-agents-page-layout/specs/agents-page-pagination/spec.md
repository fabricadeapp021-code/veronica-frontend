## ADDED Requirements

### Requirement: Compact KPI stats inline no header
A página `/apps/agents` SHALL exibir as estatísticas de agentes (total, ativos, pausados) como uma linha de texto compacta inline no header, sem cards separados. O formato SHALL ser `X agentes · Y ativos · Z pausados` com as cores: total=muted, ativos=success, pausados=warning.

#### Scenario: Stats exibidos com dados carregados
- **WHEN** a query de agentes é concluída com sucesso
- **THEN** a linha de stats é exibida imediatamente abaixo do título "Funcionários IA" no header

#### Scenario: Stats durante loading
- **WHEN** a query de agentes ainda está em andamento
- **THEN** a linha de stats exibe `…` como placeholder

---

### Requirement: Busca inline no header
A página `/apps/agents` SHALL exibir o campo de busca de agentes dentro da linha do header, eliminando o Card container separado. O campo SHALL ter largura máxima de 280px e estar posicionado entre os stats e o botão "Contratar Funcionário IA".

#### Scenario: Busca por nome
- **WHEN** o usuário digita um termo no campo de busca
- **THEN** os cards de agentes são filtrados em tempo real para exibir apenas agentes cujo nome, cargo, descrição ou templateKey contenha o termo

#### Scenario: Campo de busca vazio
- **WHEN** o campo de busca está vazio
- **THEN** todos os agentes são exibidos (sujeito à paginação)

---

### Requirement: Paginação client-side da lista de agentes
A página `/apps/agents` SHALL paginar a lista de agentes filtrados em páginas de 12 itens. Os controles de paginação SHALL ser exibidos abaixo da grade de agentes e incluir: botão "Anterior", indicador "Página X de Y", e botão "Próxima".

#### Scenario: Lista com até 12 agentes
- **WHEN** `filteredAgents.length <= 12`
- **THEN** os controles de paginação NÃO são exibidos

#### Scenario: Lista com mais de 12 agentes
- **WHEN** `filteredAgents.length > 12`
- **THEN** apenas os primeiros 12 agentes são exibidos e os controles de paginação são renderizados

#### Scenario: Navegação para próxima página
- **WHEN** o usuário clica em "Próxima"
- **THEN** a página avança e os próximos 12 agentes são exibidos

#### Scenario: Botão "Próxima" desabilitado na última página
- **WHEN** o usuário está na última página
- **THEN** o botão "Próxima" está desabilitado

#### Scenario: Botão "Anterior" desabilitado na primeira página
- **WHEN** o usuário está na primeira página
- **THEN** o botão "Anterior" está desabilitado

#### Scenario: Reset de página ao buscar
- **WHEN** o usuário altera o termo de busca
- **THEN** a paginação retorna automaticamente para a página 1
