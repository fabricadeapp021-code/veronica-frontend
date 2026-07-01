## 0. Backend — Schema: adicionar `agentId` ao Campaign

- [x] 0.1 Adicionar `@Prop({ required: true, index: true }) agentId: string` ao `CampaignSchema` em `libs/campaigns/src/schemas/campaign.schema.ts`
- [x] 0.2 Adicionar índice composto `CampaignSchema.index({ tenantId: 1, agentId: 1, status: 1 })` no mesmo arquivo
- [x] 0.3 Atualizar interface/type `Campaign` e `CreateCampaignDto` (lib) para incluir `agentId` como campo obrigatório
- [x] 0.4 Atualizar `CampaignsService.findAll()` para aceitar filtro opcional `agentId` além do `tenantId`

## 1. Backend — Endpoint de Import de Leads

- [x] 1.1 Adicionar `POST /leads/import` no `LeadsController` com `@UseInterceptors(FileInterceptor('file'))` e injetar `LeadImportService`
- [x] 1.2 Criar `ImportLeadsDto` com validação de `agentId` (obrigatório no body junto ao arquivo)
- [x] 1.3 Retornar `{ imported: number, leadIds: string[] }` no handler, repassando resultado do `LeadImportService.importFromBuffer()`
- [x] 1.4 Registrar `MulterModule` no `LeadsModule` para aceitar `multipart/form-data`

## 2. Backend — Controller REST de Campanhas

- [x] 2.1 Criar `apps/openclaw/src/campaigns/campaigns.module.ts` importando `CampaignsModule` (lib) e `QueueModule`
- [x] 2.2 Criar `apps/openclaw/src/campaigns/campaigns.controller.ts` com guard JWT e extração de `tenantId` do token
- [x] 2.3 Implementar `POST /campaigns` — validar que `agentId` do body pertence ao `tenantId` do JWT (consultar `TenantAgentService`), depois chamar `CampaignsService.create()` com `{ tenantId, agentId, ...dto }`
- [x] 2.4 Implementar `GET /campaigns` — aceitar query param opcional `agentId`, chamar `CampaignsService.findAll({ tenantId, agentId? })`
- [x] 2.5 Implementar `GET /campaigns/:id` — verificar ownership por `tenantId` antes de retornar, 404 se não pertencer ao tenant
- [x] 2.6 Implementar `GET /campaigns/:id/progress` — retornar `{ status, totalLeads, processedLeads, sentCount, deliveredCount, readCount, errorCount, skippedCount, deliveryResults }` com verificação de ownership
- [x] 2.7 Implementar `POST /campaigns/:id/start` com pre-flight de credenciais WABA:
  - validar `status: draft | paused` (409 se ativo/cancelado)
  - se `campaignType === 'whatsapp'`: chamar `getAgentWabaCredentials(tenantId, agentId)` — verificar `wabaStatus === 'active'`, `wabaPhoneNumberId` preenchido, e token presente em `TenantWabaConfig.encryptedToken` OU `TenantAgent.wabaEncryptedToken`; rejeitar com 422 e mensagem descritiva se qualquer campo faltar
  - se `campaignType === 'voice'`: verificar credenciais Retell do agente
  - só após validação: chamar `QueueService.enqueueCampaignDispatch()` e atualizar `status: active`
- [x] 2.8 Implementar `POST /campaigns/:id/pause` — validar `status: active`, chamar `QueueService.removeCampaignJobs()`, atualizar `status: paused`
- [x] 2.9 Implementar `POST /campaigns/:id/resume` — validar `status: paused`, re-enfileirar leads de `deliveryResults` com `status != 'sent' && != 'delivered' && != 'read'`, atualizar `status: active`
- [x] 2.10 Implementar `POST /campaigns/:id/stop` — remover jobs da fila, atualizar `status: cancelled`
- [x] 2.11 Registrar `CampaignsModule` no `AppModule` do `apps/openclaw`

## 3. Frontend — Serviço de API de Campanhas

- [x] 3.1 Verificar/atualizar `src/lib/api/services/campaigns.js` com as chamadas: `createCampaign`, `listCampaigns`, `getCampaign`, `getCampaignProgress`, `startCampaign`, `pauseCampaign`, `resumeCampaign`, `stopCampaign`
- [x] 3.2 Adicionar `importLeads(file, agentId)` em `src/lib/api/services/leads.js` usando `FormData` para upload multipart

## 4. Frontend — Fluxo de Criação de Campanha (CSV → Disparo)

- [x] 4.1 Atualizar `CreateCampaignBody.jsx` para incluir seletor de agente (dropdown `GET /agents` do tenant) como primeiro campo — o agente selecionado define o contexto de toda a campanha
- [x] 4.2 Incluir etapa de upload CSV/XLSX com `agentId` já selecionado; chamar `importLeads(file, agentId)` para associar leads ao agente correto
- [x] 4.3 Adicionar componente de file input com preview de contagem de leads (`N leads encontrados`)
- [x] 4.4 Ao submeter, chamar `importLeads()` primeiro (com `agentId`), aguardar `leadIds[]`, depois chamar `createCampaign()` com `{ agentId, leadIds, ...restoDoCampo }`
- [x] 4.5 Após criação com sucesso, redirecionar para `/apps/campaigns/[id]/monitor` automaticamente

## 5. Frontend — Tela de Monitoramento

- [x] 5.1 Criar `src/app/(apps layout)/apps/campaigns/[id]/monitor/page.jsx` com carregamento inicial via `getCampaign(id)`
- [x] 5.2 Criar `CampaignMonitorBody.jsx` com `useEffect` que inicia polling de `getCampaignProgress(id)` a cada 5000ms
- [x] 5.3 Parar polling quando `status` for `completed` ou `cancelled` (usar `clearInterval` no cleanup do `useEffect`)
- [x] 5.4 Implementar cards de resumo: Total | Enviado | Entregue | Lido | Erro | Pulado (reutilizar estilo dos cards existentes no projeto)
- [x] 5.5 Implementar barra de progresso `(processedLeads / totalLeads * 100)%`
- [x] 5.6 Implementar tabela de `deliveryResults` com colunas: Nome, Telefone, Status (badge colorido), Enviado em, Entregue em
- [x] 5.7 Implementar paginação local da tabela (25 linhas por página, reutilizar padrão do `LeadListBody`)
- [x] 5.8 Implementar botões condicionais: Pausar (active), Retomar (paused), Parar (active|paused com modal de confirmação)
- [x] 5.9 Adicionar link "Monitorar" na `CampaignListBody.jsx` apontando para `/apps/campaigns/[id]/monitor`
- [x] 5.10 Tratar erro 422 do `POST /campaigns/:id/start` na UI — exibir toast/alert com a mensagem de `detail` retornada pelo backend (ex: "WABA não configurado: wabaPhoneNumberId ausente") em vez de mensagem genérica
