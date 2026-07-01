## Why

Operadores da Ranny precisam de uma forma simples de disparar listas de leads (CSV/XLSX) e acompanhar o progresso em tempo real — hoje não há nenhuma tela para isso. Após o disparo, a Ranny assume o fluxo completo via Lead Connector e ClickUp; o operador só precisa iniciar e monitorar.

## What Changes

- **Nova tela de monitoramento de campanha** (`/apps/campaigns/[id]/monitor`) com cards de progresso e tabela de status por lead
- **Endpoint REST de campanhas** expondo o `CampaignsService` existente (controller faltando no backend)
- **Endpoint de import CSV/XLSX** expondo o `LeadImportService` existente (endpoint faltando no backend)
- **Fluxo de criação simplificado**: Upload CSV → contagem de leads → nomear campanha → escolher canal → Disparar
- Reutilização dos processadores BullMQ existentes (WhatsApp via n8n, Voice via Retell) — sem alterações nesses módulos

## Capabilities

### New Capabilities

- `campaign-dispatch`: Criar campanha a partir de lista CSV/XLSX e disparar para canal WhatsApp ou Voice com controles de início, pausa e parada
- `campaign-monitor`: Acompanhar em tempo real o progresso do disparo: total, enviados, entregues, lidos, erros e pulados — com tabela por lead e polling a cada 5s

### Modified Capabilities

<!-- Nenhuma spec existente com mudança de requisito -->

## Impact

**Backend (`openclaw-api`):**
- `apps/openclaw/src/campaigns/campaigns.controller.ts` — novo arquivo (controller REST)
- `apps/openclaw/src/campaigns/campaigns.module.ts` — novo arquivo (módulo NestJS)
- `apps/openclaw/src/leads/leads.controller.ts` — novo endpoint `POST /leads/import` (multipart)

**Frontend (`openclaw-frontend`):**
- `src/app/(apps layout)/apps/campaigns/[id]/monitor/page.jsx` — nova página
- `src/app/(apps layout)/apps/campaigns/[id]/monitor/CampaignMonitorBody.jsx` — novo componente
- `src/app/(apps layout)/apps/campaigns/create/CreateCampaignBody.jsx` — adicionar upload CSV ao fluxo de criação existente

**Sem quebra de contrato:** Os módulos BullMQ, `CampaignsService`, `LeadImportService` e `QueueService` não são modificados.
