## Context

O `CampaignsService`, `LeadImportService`, `QueueService` e os processadores BullMQ (WhatsApp/Voice) já existem e estão funcionais no `openclaw-api`. O que falta é:

1. Um `CampaignsController` NestJS para expor esses serviços via REST
2. Um endpoint de import de leads no `LeadsController` existente
3. Uma tela de monitoramento no frontend Next.js

**Decisão arquitetural adicionada:** Campanhas são genéricas e reutilizáveis por qualquer agente do tenant. O sistema é baseado em conectores — se um agente tem Lead Connector + ClickUp ativo, ele pode executar campanhas. Hoje é a Ranny; amanhã pode ser um agente imobiliário, de suporte, ou outro. O `agentId` é gravado na campanha para indicar qual agente executa o fluxo pós-disparo.

**Schema atual do Campaign:** tem `tenantId` e `candidateId` (opcional, propósito indefinido), mas **não tem `agentId`**. Esse campo precisa ser adicionado.

**Stack relevante:**
- Backend: NestJS, TypeScript, MongoDB/Mongoose, BullMQ/Redis
- Frontend: Next.js (App Router), React, React-Bootstrap
- Autenticação: JWT com `tenantId` extraído do token

## Goals / Non-Goals

**Goals:**
- Expor `CampaignsService` via REST com isolamento por `tenantId`
- Expor `LeadImportService` via endpoint multipart (`POST /leads/import`)
- Tela de criação de campanha com upload de CSV/XLSX
- Tela de monitoramento com polling a cada 5s
- Reutilizar componentes e padrões existentes do frontend (`CampaignListBody`, `LeadListBody`)

**Non-Goals:**
- Funil Kanban de leads (responsabilidade do ClickUp via Ranny)
- WebSocket / SSE para monitoramento em tempo real (polling é suficiente)
- Templates visuais de mensagem (já existe no schema, escopo futuro)
- Agendamento de campanha (`scheduledFor` — escopo futuro)
- Relatórios históricos e analytics avançados

## Decisions

### D1: Polling em vez de WebSocket no monitor
**Escolha:** Polling HTTP a cada 5s via `setInterval` no frontend.
**Alternativa considerada:** WebSocket ou SSE.
**Rationale:** O estado de campanha muda em granularidade de segundos, não milissegundos. Polling é mais simples, não requer infraestrutura adicional, e a latência de 5s é aceitável para o caso de uso. WebSocket adicionaria complexidade de gerenciamento de conexão sem benefício percebível.

### D2: Controller REST no `apps/openclaw` (não biblioteca)
**Escolha:** Criar `campaigns.controller.ts` e `campaigns.module.ts` em `apps/openclaw/src/campaigns/`.
**Alternativa considerada:** Expor via módulo da biblioteca `libs/campaigns`.
**Rationale:** Controllers são artefatos de aplicação (routing, guards, decorators HTTP). A biblioteca mantém a lógica de domínio pura. O padrão existente no projeto (`leads.controller.ts` em `apps/openclaw`) confirma essa separação.

### D3: Import CSV via endpoint multipart no controller de leads
**Escolha:** `POST /leads/import` com `@UseInterceptors(FileInterceptor('file'))` no `LeadsController` existente.
**Alternativa considerada:** Endpoint dedicado em `/campaigns/import` que cria leads e campanha em uma chamada.
**Rationale:** Separar criação de leads do disparo segue a separação de responsabilidades já existente. O frontend faz: (1) upload CSV → recebe `leadIds[]`, (2) cria campanha com esses `leadIds`, (3) dispara. Isso também permite reusar leads em múltiplas campanhas.

### D4: Endpoint de progresso separado (`GET /campaigns/:id/progress`)
**Escolha:** Endpoint dedicado retornando só os campos de progresso do schema (`processedLeads`, `totalLeads`, `sentCount`, `deliveredCount`, `readCount`, `errorCount`, `skippedCount`, `status`, `deliveryResults`).
**Alternativa:** Incluir progresso no `GET /campaigns/:id`.
**Rationale:** O polling no frontend chama esse endpoint a cada 5s. Retornar só os campos necessários reduz payload e é mais performático. O endpoint `GET /campaigns/:id` pode retornar o documento completo para o carregamento inicial.

### D6: Campaign é agent-agnostic — bound por `agentId` na criação, não hardcoded
**Escolha:** Adicionar campo `agentId` (required, indexed) ao `CampaignSchema`. Na criação de uma campanha, o operador seleciona o agente executor. O `agentId` define: qual contexto de leads (`LeadService` usa `tenantId + agentId`), qual canal de disparo (derivado das `AgentIntegration` do agente), e qual instância OpenClaw recebe as respostas dos leads.
**Alternativa considerada:** Deixar campanha só com `tenantId` e descobrir o agente em runtime.
**Rationale:** Cada agente tem sua própria configuração de conectores (WhatsApp number, Retell number, ClickUp workspace). Sem `agentId` na campanha, o dispatcher não sabe qual número WhatsApp usar, qual agente recebe as respostas, e o `LeadService` não consegue associar os leads importados ao agente correto. O campo `agentId` é a âncora de toda a execução conector-driven.

**Impacto no schema:** adicionar ao `CampaignSchema`:
```typescript
@Prop({ required: true, index: true })
agentId: string;
```
E adicionar índice composto: `CampaignSchema.index({ tenantId: 1, agentId: 1, status: 1 })`.

**Impacto no fluxo:**
```
Operador seleciona agente → cria campanha com agentId
  → importa CSV com agentId → leads ficam em (tenantId, agentId)
  → disparo usa config do agente (WhatsApp number, Retell number)
  → respostas chegam para o agente correto no OpenClaw
  → Ranny / qualquer outro agente assume o fluxo via conectores ativos
```

### D5: `deliveryResults` na tabela de monitoramento — paginação por frontend
**Escolha:** Retornar todos os `deliveryResults` no endpoint de progresso e paginar no frontend.
**Alternativa:** Paginação server-side.
**Rationale:** Campanhas típicas têm até ~5.000 leads. O schema já armazena `deliveryResults[]` inline no documento da campanha. Para volumes maiores (fase futura), seria necessário migrar para coleção separada — documentado como risco.

## Risks / Trade-offs

- **`deliveryResults` inline no MongoDB** → Para campanhas com >10.000 leads, o documento pode crescer além do limite de 16MB do MongoDB. Mitigação: adicionar validação de tamanho máximo de batch ao criar campanha; para fase futura, migrar para coleção separada `CampaignDelivery`.
- **Polling a cada 5s** → Múltiplos operadores monitorando a mesma campanha geram carga proporcional. Mitigação: o endpoint de progresso é leitura simples por `_id` com índice, impacto mínimo.
- **`LeadImportService` sem deduplicação cross-campanha** → Leads duplicados entre campanhas distintas podem receber contato em excesso. Mitigação: o `MessageThrottleService` já tem hard stop de 2 msgs/dia por número — protege o destinatário.
- **Sem autenticação no endpoint de progresso** → O polling do frontend usa o mesmo JWT. Risco controlado — o guard verifica `tenantId` em todos os endpoints.
- **`lead_send_message` falha silenciosamente sem WABA configurado** → Se o `TenantAgent` não tiver `wabaStatus: 'active'` + `wabaPhoneNumberId` + token (em `TenantWabaConfig` ou `wabaEncryptedToken` no agent), o worker BullMQ retorna `waba_not_configured` após já ter sido enfileirado. Mitigação: **pre-flight check obrigatório no `POST /campaigns/:id/start`** — consultar `getAgentWabaCredentials(tenantId, agentId)` antes de qualquer enfileiramento; rejeitar com 422 descrevendo qual campo está ausente. Isso transforma falha silenciosa em erro explícito antes do disparo.

## Migration Plan

1. **Migração de schema necessária:** adicionar `agentId` ao `CampaignSchema` como campo obrigatório com índice. Campanhas existentes sem `agentId` devem ser atualizadas ou tratadas como legado. O campo pode ser adicionado com `required: false` temporariamente para não quebrar registros existentes, e depois de migrar os dados existentes, tornar `required: true`.
2. Registrar `CampaignsModule` (com `AgentsModule` para validar ownership do `agentId`) no `AppModule` do `apps/openclaw`
3. Adicionar `FileInterceptor` ao `LeadsModule` (dependência `@nestjs/platform-express` já presente)
4. Deploy do backend antes do frontend (endpoints devem existir antes das telas chamar)
5. Rollback: remover o `CampaignsModule` do `AppModule` — nenhuma dado existente é afetado

## Open Questions

- Qual o limite máximo de leads por campanha a aceitar no import? (sugestão: 5.000)
- O canal padrão ao criar campanha deve ser WhatsApp ou o operador sempre escolhe?
