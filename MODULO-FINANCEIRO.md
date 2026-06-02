# 💰 MÓDULO FINANCEIRO - GOVERNAI

## 📋 RESUMO EXECUTIVO

Módulo completo de **Gestão Financeira e Compliance TSE** desenvolvido para o GovernAI, com funcionalidades mockadas para apresentação e demonstração.

---

## 🎯 OBJETIVO

Gerenciar toda a parte financeira de campanhas eleitorais com **conformidade total** às normas do **TSE (Tribunal Superior Eleitoral)**, incluindo:

- ✅ Controle de receitas e despesas
- ✅ Digitalização automática de notas fiscais com OCR/IA
- ✅ Categorização automática conforme normas TSE
- ✅ Alertas de limite de gastos (80%, 95%, 100%)
- ✅ Bloqueio automático quando limite é atingido
- ✅ Geração de relatórios para prestação de contas TSE
- ✅ Exportação em formato aceito pelo TSE (SPCE)

---

## 🏗️ ESTRUTURA DO MÓDULO

```
💰 FINANCEIRO
  ├─ 📊 Visão Geral (Dashboard Principal)
  ├─ 📋 Despesas
  ├─ 💳 Receitas/Doações
  ├─ 🧾 Notas Fiscais (com OCR/IA)
  └─ 📊 Prestação de Contas TSE
```

---

## 📱 TELAS IMPLEMENTADAS

### 1️⃣ 📊 Visão Geral (Overview)

**Arquivo:** `/apps/financial/overview/page.jsx`

**Funcionalidades:**
- 💰 Cards resumidos: Orçamento Total, Total Gasto, Total Arrecadado, Disponível
- 🚨 Alertas em tempo real de limites críticos
- 📊 Controle de limites por categoria (com barras de progresso coloridas)
- 📋 Lista de transações recentes (receitas e despesas)
- 🎨 Design visual com status: verde (ok), amarelo (atenção), vermelho (crítico)

**Categorias TSE Monitoradas:**
1. **Propaganda** (Limite: 35% = R$ 175k)
2. **Despesas com Pessoal** (Limite: 30% = R$ 150k)
3. **Transporte** (Limite: 15% = R$ 75k)
4. **Comitê** (Limite: 10% = R$ 50k)
5. **Serviços Prestados** (Limite: 10% = R$ 50k)

**Dados Mockados:**
- Orçamento: R$ 500.000,00
- Gasto: R$ 387.500,00 (77,5%)
- Disponível: R$ 112.500,00
- 5 transações recentes

---

### 2️⃣ 🧾 Notas Fiscais (Invoices)

**Arquivo:** `/apps/financial/invoices/page.jsx`

**Funcionalidades:**

**Upload Inteligente:**
- 📤 Upload de PDF, JPG, PNG, XML (NF-e)
- 🤖 **OCR Automático** - Extração de dados da nota
- 🧠 **IA para Categorização** - Sugere categoria TSE automaticamente
- ⚡ Processamento em 5 steps animados:
  1. Enviando arquivo
  2. Extraindo texto com OCR
  3. Analisando com IA
  4. Categorizando automaticamente
  5. Concluído

**Lista de Notas:**
- 📄 Tabela completa com: Número, Data, Fornecedor, Categoria, Valor, Status
- 🎯 Badge de confiança da IA (ex: 95%)
- ✅ Status: Validado, Pendente, Rejeitado
- 👁️ Modal de detalhes com itens da nota

**Modal de Detalhes:**
- Dados do fornecedor (nome, CNPJ)
- Categoria TSE automaticamente detectada
- Tabela de itens (descrição, qtd, valor unit., total)
- Botões: Baixar PDF, Validar, Rejeitar

**Dados Mockados:**
- 4 notas fiscais cadastradas
- 2 validadas, 2 pendentes
- Total: R$ 17.350,00

---

### 3️⃣ 📊 Prestação de Contas TSE

**Arquivo:** `/apps/financial/tse-reports/page.jsx`

**Funcionalidades:**

**Header da Campanha:**
- Candidato: Marcos Almeida
- Número: 00
- Partido: PRC - Partido da Renovação Cidadã
- Cargo: Prefeito de São Paulo/SP
- Badge de conformidade: ✅ Em Conformidade / ⚠️ Atenção / 🚨 Não Conforme

**Resumo Financeiro:**
- 💰 Receitas totais
- 💸 Despesas totais
- 💵 Saldo disponível
- 📊 % Utilizado

**Checklist de Conformidade TSE:**
- ✅ Limite de gastos por categoria
- ✅ Documentação fiscal completa
- ✅ Declaração de doadores
- ✅ Prestação de contas parcial em dia
- ✅ Conta bancária específica aberta

**Receitas por Origem:**
- Recursos Próprios (40%)
- Doações PF (30%)
- Doações PJ (20%)
- Fundo Partidário (10%)

**Despesas por Categoria TSE:**
Tabela com código TSE, nome, valor e % usado

**Exportação:**
- 🔽 Botão "Gerar Relatório TSE"
- 📦 Gera pacote com 6 arquivos:
  1. Receitas.txt
  2. Despesas.txt
  3. Doadores.txt
  4. Fornecedores.txt
  5. Extrato.txt
  6. Comprovantes/ (pasta com PDFs)

---

## 🎨 COMPONENTES CRIADOS

### 📁 Estrutura de Arquivos:

```
src/app/(apps layout)/apps/financial/
├── FinancialHeader.jsx
├── FinancialSidebar.jsx
├── overview/
│   └── page.jsx (Visão Geral)
├── invoices/
│   └── page.jsx (Notas Fiscais)
└── tse-reports/
    └── page.jsx (Prestação TSE)
```

### 🧩 Componentes Reutilizáveis:

**FinancialHeader.jsx:**
- Breadcrumb de navegação
- Dropdown com ações rápidas:
  - Exportar Relatório
  - Importar Dados
  - Gerar Prestação TSE

**FinancialSidebar.jsx:**
- Menu lateral com 5 itens
- Navegação ativa (highlight)
- Badge de notificação (3 pendentes nas Notas Fiscais)

---

## 🎯 CONFORMIDADE TSE

### Categorias TSE (Resolução nº 23.607/2019):

| Código | Categoria | Limite % | Limite R$ (base 500k) |
|--------|-----------|----------|----------------------|
| 1 | Despesas com Pessoal | 30% | R$ 150.000 |
| 2 | Propaganda | 35% | R$ 175.000 |
| 3 | Comitê | 10% | R$ 50.000 |
| 4 | Transporte | 15% | R$ 75.000 |
| 5 | Serviços Prestados | 10% | R$ 50.000 |

### Sistema de Alertas:

| % Usado | Status | Cor | Ação |
|---------|--------|-----|------|
| 0-79% | ✅ OK | Verde | Nenhuma |
| 80-94% | ⚠️ Atenção | Amarelo | Alerta email |
| 95-99% | 🟠 Crítico | Laranja | Alerta SMS + Email |
| 100%+ | 🔴 Bloqueado | Vermelho | Bloqueia novas despesas |

---

## 💡 DIFERENCIAIS TÉCNICOS

### 🤖 IA e Automação:

1. **OCR Inteligente**
   - Extrai automaticamente: número NF, CNPJ, valor, data, itens
   - Suporta: PDF, imagem, XML (NF-e)
   - Confiança da IA exibida (ex: 95%)

2. **Categorização Automática**
   - IA sugere categoria TSE baseada na descrição
   - Aprende com validações anteriores
   - Pode ser corrigida manualmente

3. **Alertas Inteligentes**
   - Monitora limites em tempo real
   - Notifica múltiplos canais: Email, WhatsApp, SMS, Push
   - Escalonamento: 80% → 95% → 100%

4. **Bloqueio Preventivo**
   - Impede registro de despesas acima do limite
   - Sugere reclassificação ou solicitação de aprovação
   - Log de auditoria de todas as tentativas

---

## 📊 DADOS MOCKADOS PARA APRESENTAÇÃO

### Financeiro:
- **Orçamento:** R$ 500.000,00
- **Receitas:** R$ 500.000,00
- **Despesas:** R$ 387.500,00 (77,5%)
- **Saldo:** R$ 112.500,00

### Notas Fiscais (4):
1. NF-001234 - Gráfica XYZ - R$ 3.500 (Propaganda) ✅
2. NF-001235 - Posto ABC - R$ 850 (Transporte) ⚠️
3. NF-001236 - Imobiliária - R$ 4.500 (Comitê) ✅
4. NF-001237 - Instituto Pesquisa - R$ 8.500 (Serviços) ⚠️

### Receitas por Tipo:
- Recursos Próprios: R$ 200.000 (40%)
- Doações PF: R$ 150.000 (30%)
- Doações PJ: R$ 100.000 (20%)
- Fundo Partidário: R$ 50.000 (10%)

### Alertas (3):
1. 🔴 Transporte: 98% do limite (crítico)
2. 🔴 Propaganda: 89% do limite (atenção)
3. 🟠 Pessoal: 72% do limite (monitorar)

---

## 🚀 COMO USAR NA APRESENTAÇÃO

### 1. Visão Geral:
```
URL: http://localhost:3006/apps/financial/overview
```
- Mostre os cards de resumo
- Destaque os alertas críticos (vermelho)
- Explique as barras de progresso por categoria
- Mostre as transações recentes

### 2. Notas Fiscais:
```
URL: http://localhost:3006/apps/financial/invoices
```
- Clique em "Fazer Upload de Nota Fiscal"
- Mostre o processamento OCR animado (5 steps)
- Abra uma nota pendente e mostre os detalhes
- Explique a confiança da IA (95%)

### 3. Prestação TSE:
```
URL: http://localhost:3006/apps/financial/tse-reports
```
- Mostre o checklist de conformidade
- Explique as categorias TSE
- Clique em "Gerar Relatório TSE"
- Mostre os arquivos que seriam exportados

---

## 🎨 UI/UX

### Paleta de Cores (Semáforo):
- 🟢 **Verde** (#28a745): 0-79% usado, status OK
- 🟡 **Amarelo** (#ffc107): 80-94% usado, atenção
- 🟠 **Laranja** (#fd7e14): 95-99% usado, crítico
- 🔴 **Vermelho** (#dc3545): 100%+ usado, bloqueado

### Componentes UI:
- Cards com sombra suave
- ProgressBar animadas
- Badges coloridas por status
- Modais centralizados
- Tabelas responsivas
- SimpleBar para scroll

---

## 📂 INTEGRAÇÃO COM MENU

**Adicionado no SidebarMenu.jsx:**

```javascript
// 💰 FINANCEIRO - Gestão Financeira & TSE
{
    group: '💰 FINANCEIRO',
    contents: [
        {
            id: "dash_financial_overview",
            name: 'Visão Geral',
            icon: <Icons.Dashboard />,
            path: '/apps/financial/overview',
            grp_name: "financial",
        },
        {
            id: "dash_expenses",
            name: 'Despesas',
            icon: <Icons.Receipt />,
            path: '/apps/financial/expenses',
            grp_name: "financial",
        },
        {
            id: "dash_revenues",
            name: 'Receitas',
            icon: <Icons.Cash />,
            path: '/apps/financial/revenues',
            grp_name: "financial",
        },
        {
            id: "dash_invoices",
            name: 'Notas Fiscais',
            icon: <Icons.FileInvoice />,
            path: '/apps/financial/invoices',
            grp_name: "financial",
        },
        {
            id: "dash_tse_reports",
            name: 'Prestação de Contas',
            icon: <Icons.ReportAnalytics />,
            path: '/apps/financial/tse-reports',
            grp_name: "financial",
        },
    ]
},
```

---

## ✅ STATUS DE IMPLEMENTAÇÃO

| Funcionalidade | Status | Observações |
|----------------|--------|-------------|
| Visão Geral | ✅ Completo | Dashboard com métricas e alertas |
| Notas Fiscais | ✅ Completo | Upload, OCR mockado, lista, detalhes |
| Prestação TSE | ✅ Completo | Relatório completo, exportação mockada |
| Sidebar | ✅ Completo | Menu lateral com navegação |
| Header | ✅ Completo | Breadcrumb e ações rápidas |
| Despesas | ⏳ Pendente | Usar dados mockados da visão geral |
| Receitas | ⏳ Pendente | Usar dados mockados da visão geral |

---

## 🎬 ROTEIRO DE APRESENTAÇÃO

### Minuto 1-2: Contexto
> "Campanhas eleitorais no Brasil precisam prestar contas ao TSE. Nosso módulo financeiro automatiza todo esse processo."

### Minuto 3-4: Visão Geral
> "Aqui temos o dashboard principal. Veja os alertas: Transporte está em 98%, quase bloqueado!"

### Minuto 5-6: Upload de Nota
> "Agora vou fazer upload de uma nota fiscal. A IA extrai tudo automaticamente e categoriza conforme normas TSE."

### Minuto 7-8: Prestação de Contas
> "Por fim, geramos o relatório completo para o TSE em um clique. Tudo nos formatos exigidos por lei."

---

## 🔐 SEGURANÇA E AUDITORIA

- 📝 Log de todas as ações (quem, quando, o quê)
- 🔒 Controle de acesso por perfil (admin, contador, auditor)
- 🚨 Alertas de tentativas de ultrapassar limites
- 📊 Rastreabilidade completa de despesas e receitas

---

## 📞 PRÓXIMOS PASSOS (Futuro)

1. **Integração Real:**
   - Conectar com API de OCR (Google Vision, AWS Textract)
   - Integrar com sistema contábil da campanha
   - API do TSE para validação em tempo real

2. **Funcionalidades Extras:**
   - Dashboard do tesoureiro (específico)
   - Aprovação de despesas em múltiplos níveis
   - Conciliação bancária automática
   - Integração com WhatsApp para alertas

3. **Relatórios:**
   - Gráficos avançados (Chart.js)
   - Exportação em múltiplos formatos
   - Relatórios comparativos (mês a mês)

---

## 📊 IMPACTO ESPERADO

✅ **Redução de 80%** no tempo de prestação de contas  
✅ **0 erros** de categorização TSE  
✅ **100% compliance** com normas eleitorais  
✅ **Prevenção proativa** de irregularidades  

---

**Desenvolvido para:** GovernAI  
**Módulo:** 💰 FINANCEIRO  
**Data:** 25 de Janeiro de 2026  
**Status:** ✅ Pronto para Apresentação  

**Powered by:** IA + Automação + Compliance TSE
