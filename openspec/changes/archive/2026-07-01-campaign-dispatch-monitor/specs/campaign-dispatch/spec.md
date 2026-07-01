## ADDED Requirements

### Requirement: Operador pode importar lista de leads via CSV ou XLSX
O sistema SHALL aceitar upload de arquivo CSV ou XLSX com no mínimo as colunas `name` e `phone`. O `LeadImportService` existente SHALL processar o arquivo, fazer upsert de cada lead por `(tenantId, agentId, phone)` e retornar a lista de `leadIds` criados ou atualizados.

#### Scenario: Upload de CSV válido
- **WHEN** operador envia `POST /leads/import` com arquivo CSV contendo colunas `name` e `phone`
- **THEN** sistema retorna `{ imported: N, leadIds: [...] }` com status 201

#### Scenario: Upload de XLSX válido
- **WHEN** operador envia `POST /leads/import` com arquivo XLSX
- **THEN** sistema retorna `{ imported: N, leadIds: [...] }` com status 201

#### Scenario: Arquivo sem coluna phone
- **WHEN** operador envia arquivo sem coluna `phone`
- **THEN** sistema retorna erro 400 com mensagem descritiva

#### Scenario: Lead já existente é atualizado (não duplicado)
- **WHEN** operador importa CSV com phone já cadastrado no mesmo `tenantId + agentId`
- **THEN** sistema faz upsert e retorna o `leadId` existente (sem duplicar)

---

### Requirement: Campanha é sempre associada a um agente executor
O sistema SHALL exigir `agentId` ao criar uma campanha. O `agentId` MUST pertencer ao mesmo `tenantId` do operador autenticado. O agente executor determina: o canal de disparo (WhatsApp number ou Retell number configurados nas integrações do agente), os leads associados (`LeadService` filtra por `tenantId + agentId`), e qual instância OpenClaw recebe as respostas. Qualquer agente do tenant com Lead Connector ativo pode ser executor de uma campanha.

#### Scenario: Campanha criada com agente válido do tenant
- **WHEN** operador cria campanha com `agentId` que pertence ao seu `tenantId`
- **THEN** campanha é criada com `agentId` gravado e isolada por `(tenantId, agentId)`

#### Scenario: Tentativa de criar campanha com agente de outro tenant
- **WHEN** operador informa `agentId` que não pertence ao seu `tenantId`
- **THEN** sistema retorna 404 (sem vazar existência do agente)

#### Scenario: Listagem de campanhas filtrada por agente
- **WHEN** operador lista campanhas de um agente específico via `GET /campaigns?agentId=X`
- **THEN** sistema retorna apenas campanhas com `tenantId` do operador e `agentId: X`

#### Scenario: Listagem de campanhas de todo o tenant
- **WHEN** operador lista campanhas sem filtro de agente via `GET /campaigns`
- **THEN** sistema retorna todas as campanhas do `tenantId` do operador, independente do agente

---

### Requirement: Operador pode criar campanha associando leads importados
O sistema SHALL permitir criar uma campanha com `name`, `agentId`, `campaignType` (whatsapp | voice) e `leadIds[]`. A campanha SHALL ser criada com `status: draft` e isolada por `(tenantId, agentId)`.

#### Scenario: Criação de campanha WhatsApp com leads e agente
- **WHEN** operador envia `POST /campaigns` com `name`, `agentId`, `campaignType: "whatsapp"` e `leadIds[]`
- **THEN** sistema cria campanha com `status: draft`, `agentId` gravado, e retorna o documento criado com status 201

#### Scenario: Criação de campanha Voice com leads e agente
- **WHEN** operador envia `POST /campaigns` com `agentId`, `campaignType: "voice"` e `leadIds[]`
- **THEN** sistema cria campanha com `status: draft`, `agentId` gravado, e retorna o documento criado com status 201

#### Scenario: Tentativa de criar campanha sem leads
- **WHEN** operador envia `POST /campaigns` sem `leadIds` ou com array vazio
- **THEN** sistema retorna erro 400

---

### Requirement: Sistema valida credenciais WABA antes de disparar campanha WhatsApp
Antes de enfileirar qualquer job de disparo WhatsApp, o sistema SHALL verificar que o agente executor (`agentId`) possui as três condições simultaneamente no MongoDB:

| Campo | Localização | Condição |
|-------|-------------|----------|
| `wabaStatus` | `TenantAgent` | `=== 'active'` |
| `wabaPhoneNumberId` | `TenantAgent` | não nulo e não vazio |
| `encryptedToken` | `TenantWabaConfig` (tenant) **OU** `wabaEncryptedToken` no `TenantAgent` | pelo menos um preenchido |

Se qualquer condição falhar, o `POST /campaigns/:id/start` SHALL rejeitar com `422 Unprocessable Entity` e body descrevendo qual campo está ausente, em vez de enfileirar e falhar silenciosamente no worker.

#### Scenario: Disparo WhatsApp com WABA configurado corretamente
- **WHEN** agente tem `wabaStatus: 'active'`, `wabaPhoneNumberId` preenchido e token disponível em qualquer das duas fontes
- **THEN** sistema enfileira dispatch e retorna `{ queued: true }` com status 200

#### Scenario: Disparo WhatsApp com wabaStatus inativo
- **WHEN** agente tem `wabaStatus !== 'active'`
- **THEN** sistema retorna 422 com `{ error: 'waba_not_configured', detail: 'wabaStatus is not active' }`

#### Scenario: Disparo WhatsApp sem wabaPhoneNumberId
- **WHEN** agente não tem `wabaPhoneNumberId` preenchido
- **THEN** sistema retorna 422 com `{ error: 'waba_not_configured', detail: 'wabaPhoneNumberId is missing' }`

#### Scenario: Disparo WhatsApp sem token em nenhuma fonte
- **WHEN** `TenantWabaConfig.encryptedToken` é nulo E `TenantAgent.wabaEncryptedToken` é nulo
- **THEN** sistema retorna 422 com `{ error: 'waba_not_configured', detail: 'WABA token not found' }`

#### Scenario: Disparo Voice não exige validação WABA
- **WHEN** campanha tem `campaignType: 'voice'`
- **THEN** sistema pula validação WABA e verifica apenas credenciais Retell do agente

---

### Requirement: Operador pode disparar uma campanha
O sistema SHALL enfileirar o disparo via `QueueService.enqueueCampaignDispatch()` e atualizar o status da campanha para `active`. O disparo SHALL ser assíncrono — a resposta HTTP confirma o enfileiramento, não a entrega. Para campanhas WhatsApp, a validação de credenciais WABA (requisito acima) MUST ocorrer antes do enfileiramento.

#### Scenario: Disparo de campanha em draft
- **WHEN** operador envia `POST /campaigns/:id/start` e credenciais estão válidas
- **THEN** sistema enfileira jobs BullMQ, atualiza `status: active` e retorna `{ queued: true }` com status 200

#### Scenario: Tentativa de disparar campanha já ativa
- **WHEN** operador envia `POST /campaigns/:id/start` em campanha com `status: active`
- **THEN** sistema retorna erro 409 (Conflict)

#### Scenario: Campanha de outro tenant não pode ser disparada
- **WHEN** operador autenticado tenta disparar campanha de outro `tenantId`
- **THEN** sistema retorna 404 (not found — sem vazar existência)

---

### Requirement: Operador pode pausar e retomar uma campanha
O sistema SHALL remover os jobs pendentes da fila via `QueueService.removeCampaignJobs()` ao pausar, e re-enfileirar os leads restantes ao retomar.

#### Scenario: Pausar campanha ativa
- **WHEN** operador envia `POST /campaigns/:id/pause`
- **THEN** sistema remove jobs waiting/delayed da fila, atualiza `status: paused` e retorna 200

#### Scenario: Retomar campanha pausada
- **WHEN** operador envia `POST /campaigns/:id/resume`
- **THEN** sistema re-enfileira leads não enviados, atualiza `status: active` e retorna 200

---

### Requirement: Operador pode parar definitivamente uma campanha
O sistema SHALL remover todos os jobs pendentes e marcar a campanha como `cancelled`.

#### Scenario: Parar campanha ativa
- **WHEN** operador envia `POST /campaigns/:id/stop`
- **THEN** sistema remove jobs, atualiza `status: cancelled` e retorna 200

#### Scenario: Campanha cancelada não pode ser reiniciada
- **WHEN** operador tenta `POST /campaigns/:id/start` em campanha com `status: cancelled`
- **THEN** sistema retorna erro 409
