## ADDED Requirements

### Requirement: Operador pode ver o progresso em tempo real do disparo
O sistema SHALL expor `GET /campaigns/:id/progress` retornando os contadores de progresso e a lista de `deliveryResults`. O frontend SHALL fazer polling desse endpoint a cada 5 segundos enquanto a campanha estiver com `status: active`.

#### Scenario: Polling de campanha ativa
- **WHEN** frontend chama `GET /campaigns/:id/progress` enquanto `status: active`
- **THEN** sistema retorna `{ status, totalLeads, processedLeads, sentCount, deliveredCount, readCount, errorCount, skippedCount, deliveryResults[] }` com status 200

#### Scenario: Campanha de outro tenant retorna 404
- **WHEN** operador autenticado consulta progresso de campanha de outro `tenantId`
- **THEN** sistema retorna 404

#### Scenario: Polling para automaticamente quando campanha completa
- **WHEN** resposta do endpoint retorna `status: completed` ou `status: cancelled`
- **THEN** frontend para o polling e exibe estado final

---

### Requirement: Tela de monitoramento exibe cards de resumo
A tela `/apps/campaigns/[id]/monitor` SHALL exibir cards com os contadores: Total, Enviado, Entregue, Lido, Erro e Pulado. Os cards SHALL ser atualizados a cada ciclo de polling.

#### Scenario: Cards refletem estado atual da campanha
- **WHEN** tela é carregada com campanha ativa
- **THEN** cards mostram valores do último polling com atualização a cada 5s

#### Scenario: Barra de progresso visual
- **WHEN** `processedLeads > 0` e `totalLeads > 0`
- **THEN** tela exibe barra de progresso `(processedLeads / totalLeads) * 100%`

---

### Requirement: Tela de monitoramento exibe tabela de status por lead
A tela SHALL exibir uma tabela com uma linha por entrada em `deliveryResults[]`, mostrando `name`, `phone`, `status`, `sentAt` e `deliveredAt`. A tabela SHALL ser paginada no frontend (25 linhas por página).

#### Scenario: Tabela lista leads com status
- **WHEN** campanha tem `deliveryResults` populados
- **THEN** tabela exibe cada lead com seu status (sent / delivered / read / failed / skipped)

#### Scenario: Status exibido com badge colorido
- **WHEN** status do lead é `failed` ou `skipped`
- **THEN** badge é exibido em vermelho
- **WHEN** status é `read`
- **THEN** badge é exibido em verde
- **WHEN** status é `sent` ou `delivered`
- **THEN** badge é exibido em amarelo/azul

---

### Requirement: Tela de monitoramento exibe controles de campanha
A tela SHALL exibir botões de ação conforme o `status` atual da campanha.

#### Scenario: Campanha ativa mostra botão Pausar
- **WHEN** `status: active`
- **THEN** tela exibe botão "Pausar" e oculta botão "Retomar"

#### Scenario: Campanha pausada mostra botão Retomar
- **WHEN** `status: paused`
- **THEN** tela exibe botão "Retomar" e oculta botão "Pausar"

#### Scenario: Botão Parar sempre visível em campanha ativa ou pausada
- **WHEN** `status: active` ou `status: paused`
- **THEN** tela exibe botão "Parar Campanha" que abre confirmação antes de executar

#### Scenario: Campanha completa ou cancelada não exibe controles de ação
- **WHEN** `status: completed` ou `status: cancelled`
- **THEN** botões Pausar, Retomar e Parar são ocultados
