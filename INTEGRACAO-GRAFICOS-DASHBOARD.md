# 📊 INTEGRAÇÃO DE GRÁFICOS DO DASHBOARD

## ✅ O QUE FOI FEITO

Reutilizamos os **gráficos lindos** do Dashboard principal (`/dashboard`) e os adaptamos para os módulos do sistema, mantendo a mesma estrutura visual e apenas trocando dados/contexto.

---

## 🎯 ESTRATÉGIA DE IMPLEMENTAÇÃO

### ✅ **NÃO ALTERAMOS** os componentes originais:
- `/dashboard/AudienceReviewChart.jsx` ✅ Intacto
- `/dashboard/ReturningCustomerChart.jsx` ✅ Intacto
- `/dashboard/ActiveUserMap.jsx` ✅ Intacto
- `/dashboard/CustomerTable.jsx` ✅ Intacto

### ✅ **CRIAMOS** versões adaptadas:
📁 **Nova pasta:** `src/components/shared-charts/`

Contém versões customizadas dos gráficos:

---

## 📦 COMPONENTES COMPARTILHADOS CRIADOS

### 1️⃣ **SystemActivityChart.jsx**
**Baseado em:** `AudienceReviewChart` (gráfico de barras empilhadas)

**Uso:** Mostra atividade do sistema por módulo ao longo de 12 dias

**Séries:**
- 📢 Marketing (azul escuro)
- 👥 Citizen (verde)
- 🔐 Admin (azul claro)

**Onde está:** 
- ✅ **Admin → Relatórios** (`/apps/admin/reports`)

---

### 2️⃣ **ModuleDistributionChart.jsx**
**Baseado em:** `ReturningCustomerChart` (gráfico radial/donut)

**Uso:** Mostra distribuição percentual de uso entre módulos

**Séries:**
- Marketing: 68%
- Citizen: 75%

**Props:**
- `totalValue` - Valor total exibido no centro (padrão: `$15.8k`)

**Onde está:**
- ✅ **Admin → Relatórios** (`/apps/admin/reports`)

---

### 3️⃣ **RevenueExpenseChart.jsx**
**Baseado em:** `ReturningCustomerChart` (gráfico radial/donut)

**Uso:** Mostra Receitas vs Despesas no Financeiro

**Séries:**
- 💚 Receitas (verde)
- ❤️ Despesas (vermelho)

**Props:**
- `revenue` - Valor de receitas (padrão: `850000`)
- `expense` - Valor de despesas (padrão: `620000`)

**Cálculo automático:**
- Percentuais calculados dinamicamente
- Centro mostra **Saldo** (Receitas - Despesas) em BRL

**Onde está:**
- ✅ **Financeiro → Overview** (`/apps/financial/overview`)

---

### 4️⃣ **CampaignPerformanceChart.jsx**
**Baseado em:** `AudienceReviewChart` (gráfico de barras empilhadas)

**Uso:** Mostra desempenho de campanhas de marketing

**Séries:**
- Facebook Ads (azul)
- Google Ads (verde)
- Instagram (laranja)

**Onde usar (futuro):**
- 📢 **Marketing → Dashboard**
- 📢 **Marketing → Campanhas**

---

### 5️⃣ **CitizenServiceChart.jsx**
**Baseado em:** `AudienceReviewChart` (gráfico de barras empilhadas)

**Uso:** Mostra volume de atendimentos por canal

**Séries:**
- WhatsApp (verde)
- Chat Web (azul)
- Telefone (laranja)

**Onde usar (futuro):**
- 👥 **Citizen → Dashboard**
- 👥 **Citizen → Relatórios**

---

## 🎨 PÁGINAS ATUALIZADAS

### ✅ 1. **Admin → Relatórios** (`/apps/admin/reports`)

**Adicionado:**
```jsx
import SystemActivityChart from '@/components/shared-charts/SystemActivityChart';
import ModuleDistributionChart from '@/components/shared-charts/ModuleDistributionChart';
```

**Layout:**
```
┌─────────────────────────────────────────┬──────────────────────┐
│  SystemActivityChart (9 cols)          │  ModuleDistribution  │
│  - Gráfico de barras 12 dias           │  (3 cols)            │
│  - Marketing, Citizen, Admin            │  - Gráfico radial    │
│  - Métricas abaixo: Total, Usuários,   │  - Marketing 68%     │
│    Tempo, Taxa de Sucesso               │  - Citizen 75%       │
└─────────────────────────────────────────┴──────────────────────┘
```

**Métricas exibidas:**
- ✅ Total de Ações: 125.4k (+23%)
- ✅ Usuários Ativos: 189 (+15%)
- ✅ Tempo Médio: 2m 34s (-12%)
- ✅ Taxa de Sucesso: 99.8% (+0.3%)

---

### ✅ 2. **Financeiro → Overview** (`/apps/financial/overview`)

**Adicionado:**
```jsx
import RevenueExpenseChart from '@/components/shared-charts/RevenueExpenseChart';
```

**Layout:**
```
┌─────────────────────────────────────────┬──────────────────────┐
│  Cards de Métricas (9 cols)            │  RevenueExpenseChart │
│  - Orçamento Total                      │  (3 cols)            │
│  - Total Gasto                          │  - Gráfico radial    │
│  - Disponível                           │  - Receitas vs       │
│                                         │    Despesas          │
└─────────────────────────────────────────┴──────────────────────┘
```

**Valores mockados:**
- 💚 Receitas: R$ 500.000,00
- ❤️ Despesas: R$ 387.500,00
- 💰 **Saldo:** R$ 112.500,00 (exibido no centro do gráfico)

---

## 📂 ESTRUTURA DE ARQUIVOS

```
src/
├── app/(apps layout)/
│   ├── dashboard/                           # ✅ Dashboard original (INTACTO)
│   │   ├── ChartData/
│   │   │   ├── AudienceReviewChart.jsx      # ✅ NÃO ALTERADO
│   │   │   ├── ReturningCustomerChart.jsx   # ✅ NÃO ALTERADO
│   │   │   └── ActiveUserMap.jsx            # ✅ NÃO ALTERADO
│   │   └── page.jsx
│   │
│   └── apps/
│       ├── admin/
│       │   └── reports/
│       │       └── page.jsx                  # ✅ ATUALIZADO (gráficos adicionados)
│       │
│       └── financial/
│           └── overview/
│               └── page.jsx                  # ✅ ATUALIZADO (gráfico adicionado)
│
└── components/
    └── shared-charts/                        # ✨ NOVA PASTA
        ├── SystemActivityChart.jsx           # ✨ NOVO (adaptado de AudienceReview)
        ├── ModuleDistributionChart.jsx       # ✨ NOVO (adaptado de ReturningCustomer)
        ├── RevenueExpenseChart.jsx           # ✨ NOVO (adaptado de ReturningCustomer)
        ├── CampaignPerformanceChart.jsx      # ✨ NOVO (adaptado de AudienceReview)
        └── CitizenServiceChart.jsx           # ✨ NOVO (adaptado de AudienceReview)
```

---

## 🎯 PRÓXIMOS PASSOS (OPCIONAL)

### 📍 **Onde podemos adicionar os gráficos restantes:**

#### 1️⃣ **CampaignPerformanceChart** → Marketing

**Criar:** `/apps/marketing/dashboard/page.jsx`

```jsx
import CampaignPerformanceChart from '@/components/shared-charts/CampaignPerformanceChart';

// Layout sugerido:
// - Gráfico de performance de campanhas (12 dias)
// - Métricas: Cliques, Impressões, CTR, Conversões
// - Tabela de top campanhas
```

**Ou adicionar em:** `/apps/marketing/campaigns` (Campanhas)

---

#### 2️⃣ **CitizenServiceChart** → Citizen

**Criar:** `/apps/citizen/dashboard/page.jsx`

```jsx
import CitizenServiceChart from '@/components/shared-charts/CitizenServiceChart';

// Layout sugerido:
// - Gráfico de atendimentos por canal (12 dias)
// - Métricas: Total de conversas, Tempo médio, Satisfação
// - Tabela de últimos atendimentos
```

**Ou adicionar em:** `/apps/citizen/analytics` (Análise)

---

#### 3️⃣ **ActiveUserMap** (Mapa Mundial)

**Adaptar para:** Zonas Eleitorais ou Bairros

**Criar:** `RegionalDistributionMap.jsx`

```jsx
// Substituir países por:
// - Zonas Eleitorais (Zona 1, Zona 2, Zona 3...)
// - Bairros da cidade (Centro, Norte, Sul, Leste, Oeste)
// - Regiões (Urbana, Rural, Suburbana)

// Usar em:
// - Marketing → Alcance Geográfico
// - Citizen → Atendimentos por Região
// - Admin → Usuários por Departamento
```

---

#### 4️⃣ **CustomerTable** (Tabela de Dados)

**Já existe versão similar em:**
- ✅ Financeiro → Notas Fiscais (tabela de invoices)
- ✅ Admin → Relatórios (tabela de top features)

**Pode criar:**
- Marketing → Leads Recentes
- Citizen → Últimos Atendimentos

---

## 🚀 BENEFÍCIOS DA INTEGRAÇÃO

### ✅ **Consistência Visual**
- Todos os gráficos seguem o mesmo design do dashboard original
- Cores, fontes, espaçamentos idênticos
- UX familiar para o usuário

### ✅ **Manutenibilidade**
- Componentes reutilizáveis
- Fácil atualização (atualiza 1 vez, reflete em todos)
- Código DRY (Don't Repeat Yourself)

### ✅ **Performance**
- Biblioteca ApexCharts já carregada
- Mesma biblioteca para todos os gráficos
- Dynamic import para otimização

### ✅ **Apresentação Profissional**
- Gráficos de alta qualidade
- Dados mockados realistas
- Visual impressionante para demos

---

## 📊 DADOS MOCKADOS

### **Admin - Relatórios:**
- Total de Ações: 125.4k
- Usuários Ativos: 189
- Crescimento: +23%
- 4 módulos trackados (Marketing, Citizen, Studio, Financeiro)

### **Financeiro - Overview:**
- Receitas: R$ 500.000,00
- Despesas: R$ 387.500,00
- Saldo: R$ 112.500,00
- 5 categorias de gastos TSE

---

## 🎨 CORES UTILIZADAS

```javascript
// Cores principais dos gráficos:
const colors = {
  primary: '#007D88',      // Azul escuro (tema principal)
  success: '#00CC66',      // Verde (receitas, sucesso)
  danger: '#FF3366',       // Vermelho (despesas, alertas)
  warning: '#FF9900',      // Laranja (avisos)
  info: '#0066FF',         // Azul (informações)
  secondary: '#25cba1',    // Verde claro (secundário)
  light: '#ebf3fe',        // Azul muito claro (fundo)
};
```

---

## 📝 COMO USAR OS COMPONENTES

### Exemplo 1: SystemActivityChart

```jsx
import SystemActivityChart from '@/components/shared-charts/SystemActivityChart';

<Card>
  <Card.Header>
    <h5>Atividade do Sistema</h5>
  </Card.Header>
  <Card.Body>
    <SystemActivityChart />
  </Card.Body>
</Card>
```

### Exemplo 2: RevenueExpenseChart

```jsx
import RevenueExpenseChart from '@/components/shared-charts/RevenueExpenseChart';

<Card>
  <Card.Header>
    <h5>Receitas vs Despesas</h5>
  </Card.Header>
  <Card.Body>
    <RevenueExpenseChart 
      revenue={500000} 
      expense={387500} 
    />
  </Card.Body>
</Card>
```

### Exemplo 3: ModuleDistributionChart

```jsx
import ModuleDistributionChart from '@/components/shared-charts/ModuleDistributionChart';

<Card>
  <Card.Header>
    <h5>Distribuição de Uso</h5>
  </Card.Header>
  <Card.Body>
    <ModuleDistributionChart totalValue="189 usuários" />
  </Card.Body>
</Card>
```

---

## ✅ STATUS DA IMPLEMENTAÇÃO

| Módulo | Gráfico | Status | Página |
|--------|---------|--------|--------|
| 🔐 **ADMIN** | SystemActivity | ✅ Implementado | `/apps/admin/reports` |
| 🔐 **ADMIN** | ModuleDistribution | ✅ Implementado | `/apps/admin/reports` |
| 💰 **FINANCEIRO** | RevenueExpense | ✅ Implementado | `/apps/financial/overview` |
| 📢 **MARKETING** | CampaignPerformance | ⏳ Criado (pronto para usar) | - |
| 👥 **CITIZEN** | CitizenService | ⏳ Criado (pronto para usar) | - |

---

## 🧪 TESTE AGORA

### 1️⃣ **Admin - Relatórios**
```
http://localhost:3006/apps/admin/reports
```
**Veja:**
- ✅ Gráfico de barras de 12 dias (Marketing, Citizen, Admin)
- ✅ Gráfico radial de distribuição
- ✅ Métricas de crescimento com badges

---

### 2️⃣ **Financeiro - Overview**
```
http://localhost:3006/apps/financial/overview
```
**Veja:**
- ✅ Gráfico radial Receitas vs Despesas
- ✅ Saldo no centro do gráfico
- ✅ Cards de métricas financeiras

---

## 🎯 RESULTADO FINAL

**ANTES:**
- Gráficos apenas no `/dashboard`
- Módulos com dados em tabelas simples

**DEPOIS:**
- ✅ Gráficos reutilizados em múltiplos módulos
- ✅ Visualização profissional dos dados
- ✅ Componentes compartilhados e organizados
- ✅ Fácil adicionar novos gráficos

---

## 📌 LEMBRETE

**Quer adicionar mais gráficos?**

Basta:
1. Importar o componente desejado de `/components/shared-charts/`
2. Adicionar na página
3. Ajustar dados mockados (opcional)

**Exemplo:**
```jsx
import CampaignPerformanceChart from '@/components/shared-charts/CampaignPerformanceChart';

// ... em qualquer página
<CampaignPerformanceChart />
```

---

**STATUS:** ✅ IMPLEMENTADO E TESTADO
**PRÓXIMO:** Adicionar gráficos em Marketing e Citizen (quando você quiser)
**COMPATIBILIDADE:** Next.js 15 + ApexCharts + React Bootstrap

---

**Data:** 25 de Janeiro de 2026  
**Desenvolvido para:** GovernAI Dashboard  
**Objetivo:** Integração completa de gráficos do dashboard principal
