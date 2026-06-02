# TMS Fácil — Design System

> **Identidade visual completa do TMS Fácil**. Use este documento como referência ao construir ou refatorar páginas, componentes ou fluxos. Escrito para ser consumível por humanos E por IAs (Cascade/Claude/etc).

**Última atualização**: Padronização de TopNav, Sidebar, Dashboard, Dark Mode e Tooltips.

---

## 1. Visão Geral

### 1.1 Filosofia
SaaS premium com **acentos violeta/azul** sobre base neutra. Dark mode é cidadão primário — todo componente deve ser desenhado pensando nos dois temas simultaneamente.

**Princípios**:
- **Profundidade sutil** — sombras, gradientes de 1-2% opacidade, bordas quase invisíveis
- **Contraste AA** (WCAG) — 4.5:1 em body text, 3:1 em texto grande
- **Micro-interações intencionais** — hover lift, scale em CTAs, transições ≤ 0.25s
- **Consistência de chips** — elementos do TopNav seguem fórmula única
- **Gradiente violeta como assinatura** — `#3b82f6 → #2563eb` aparece em CTAs, item ativo da sidebar, badges e faixa superior dos stat cards

### 1.2 Stack Visual
- **CSS Framework**: Bootstrap 5 + React Bootstrap (`react-bootstrap`)
- **Fonte**: DM Sans (Google Fonts) — 400, 500, 700
- **Ícones**: `react-feather` (primário) + `tabler-icons-react` (secundário)
- **Preprocess**: SCSS compilado em `src/styles/scss/style.scss`
- **Overrides runtime**: 3 `<script>` injetados em `src/app/layout.js`
  1. `colorModeScript` — aplica dark mode antes do paint (zero flash)
  2. `themeInitScript` — cores do partido (primary/secondary custom)
  3. `landingIdentityScript` — paleta violeta global (light + dark)

---

## 2. Design Tokens

### 2.1 Paleta Primária (Violet/Blue)
```css
--tms-blue:        #3b82f6;  /* primary — gradient start, borders, accents */
--tms-blue-strong: #2563eb;  /* gradient end, hover darker */
--tms-blue-soft:   #60a5fa;  /* dark mode text links, muted accents */
--tms-blue-pale:   #93c5fd;  /* titles gradient end, outline hovers */
--tms-indigo:      #6366f1;  /* gradient secundário (stat card faixa) */
```

**Gradiente assinatura** (usar em CTAs, badges, botão `+` do chip de créditos):
```css
background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
```

### 2.2 Superfícies — Dark Mode (Deep Indigo)
```css
--bs-body-bg:      #0f172a;  /* fundo do app */
--tms-surface:     #141d35;  /* cards, modais, dropdowns */
--tms-surface-2:   #1c2748;  /* card header, hover, inputs, bg-light */
--bs-tertiary-bg:  #191c27;  /* body secundário */
--bs-border-color: #2a2f3d;  /* bordas neutras */
--tms-border-violet: rgba(59,130,246,0.22);  /* bordas sutis azuis */
```

**Atmosfera global** (radial gradients fixos no `body::before`):
```css
background:
  radial-gradient(1200px 600px at 85% -10%, rgba(59,130,246,0.10), transparent 60%),
  radial-gradient(900px  500px at 5% 100%, rgba(99,102,241,0.08), transparent 55%);
```

### 2.3 Superfícies — Light Mode
```css
background app:  #ffffff
card bg:         #ffffff
card border:     1px solid rgba(59,130,246,0.08)
card hover:      border rgba(59,130,246,0.2)
muted bg:        #f8f9fa
auth/login:      sempre #ffffff (forçado mesmo em dark)
```

### 2.4 Texto

| Papel            | Dark              | Light              |
|------------------|-------------------|--------------------|
| Body             | `#c9d1e0`         | `#212529`          |
| Heading          | `#dde3ef`         | `#0f172a`          |
| Muted            | `#8d97b0` / `#5a6480` | `#64748b`      |
| Link             | `#60a5fa`         | `#2563eb`          |
| Link hover       | `#93c5fd`         | `#1d4ed8`          |
| Texto em chip    | `#ffffff` (dark)  | `#2563eb` (light)  |

### 2.5 Feedback Colors

| Semântica | Solid (hex) | Soft Dark BG / Text | Soft Light BG / Text |
|-----------|-------------|---------------------|----------------------|
| Success   | `#22c55e`   | `rgba(34,197,94,0.18)` / `#7ee2a8`  | `#dcfce7` / `#166534` |
| Warning   | `#f59e0b`   | `rgba(245,158,11,0.18)` / `#ffd86b` | `#fef3c7` / `#92400e` |
| Danger    | `#ef4444`   | `rgba(239,68,68,0.18)` / `#ff9aa5`  | `#fee2e2` / `#991b1b` |
| Info/Blue | `#3b82f6`   | `rgba(59,130,246,0.18)` / `#93c5fd` | `#dbeafe` / `#1e40af` |
| Secondary | `#64748b`   | `rgba(100,116,139,0.22)` / `#cbd5e1`| `#e2e8f0` / `#334155` |

**Accent especial — Créditos**:
- Ícone Zap: `color: #f59e0b; fill: #f59e0b` (fixo nos dois temas)
- Número do saldo: `#10b981` (dark) / `#059669` (light)
- Label "créditos": `#ffffff` (dark) / `#64748b` (light)

### 2.6 Tipografia

```css
font-family: 'DM Sans', sans-serif;
```

**Escala**:
| Token       | Size     | Uso                          |
|-------------|----------|------------------------------|
| xs          | 0.70rem  | label secundário (chip)      |
| sm          | 0.78rem  | texto pequeno                |
| base-sm     | 0.82rem  | botão compacto               |
| base        | 0.90rem  | texto em chips, body denso   |
| md          | 1.00rem  | body padrão                  |
| h6          | 1.00rem  | small heading                |
| h5          | 1.125rem | card title                   |
| h4          | 1.25rem  | page title                   |

**Weights**: 400 (body), 500 (medium), 700 (bold, labels de chip, números)

**Efeito gradient text** (título Dashboard no dark mode):
```css
background: linear-gradient(135deg, #ffffff 0%, #93c5fd 100%);
-webkit-background-clip: text;
background-clip: text;
color: transparent;
letter-spacing: -0.01em;
```

### 2.7 Spacing / Radius

| Token          | Valor   | Uso                                  |
|----------------|---------|--------------------------------------|
| chip-pill      | 999px   | chips do TopNav, badges, botão `+`   |
| card-dark      | 14px    | cards no dark                        |
| card-light     | 12px    | cards no light                       |
| sidebar-active | 0 10px 10px 0 | item ativo da sidebar         |
| input          | 6px     | form controls                        |
| chip-padding   | `6px 14px 6px 12px` | padding INTERNO padrão de chip |
| chip-gap       | `8px`   | gap entre ícone/texto/botão do chip  |
| topnav-gap     | `gap-2` (8px) | espaçamento entre chips       |

### 2.8 Shadows

**Dark mode**:
```css
/* Card default */
box-shadow: 0 1px 0 rgba(255,255,255,0.02) inset,
            0 10px 30px rgba(2,6,23,0.55);

/* Card hover */
box-shadow: 0 1px 0 rgba(255,255,255,0.03) inset,
            0 18px 44px rgba(2,6,23,0.6),
            0 0 0 1px rgba(59,130,246,0.12),
            0 0 40px -10px rgba(59,130,246,0.35);

/* Chip TopNav */
box-shadow: 0 4px 14px -6px rgba(0,0,0,0.55),
            inset 0 1px 0 rgba(255,255,255,0.03);

/* Chip hover */
box-shadow: 0 6px 18px -4px rgba(59,130,246,0.6),
            inset 0 1px 0 rgba(255,255,255,0.05);

/* TopNav barra */
box-shadow: 0 1px 0 0 rgba(59,130,246,0.16),
            0 4px 18px rgba(0,0,0,0.45);
```

**Light mode**:
```css
/* Card default */
box-shadow: 0 1px 2px rgba(15,23,42,0.04),
            0 4px 14px -6px rgba(15,23,42,0.08);

/* Card hover */
box-shadow: 0 4px 8px rgba(15,23,42,0.06),
            0 12px 28px -10px rgba(59,130,246,0.18);

/* Chip TopNav */
box-shadow: 0 2px 8px -3px rgba(15,23,42,0.08),
            0 1px 2px rgba(15,23,42,0.04);

/* TopNav barra */
box-shadow: 0 1px 0 rgba(59,130,246,0.08),
            0 6px 20px -8px rgba(15,23,42,0.12);

/* Button primary */
box-shadow: 0 4px 12px -4px rgba(59,130,246,0.5),
            0 1px 2px rgba(37,99,235,0.15);
```

### 2.9 Motion

**Transitions universais**:
```css
transition: transform .15s ease,
            box-shadow .2s ease,
            border-color .2s ease;
```

**Hover patterns**:
- **Lift sutil** (chips, cards, botões primários): `translateY(-1px)`
- **Scale CTA circular** (botão `+` do chip): `scale(1.08)`
- **Glow azul** (card): border muda para `rgba(59,130,246,0.28)` + sombra azul adicional
- **Active state**: `translateY(0)` + sombra reduzida

---

## 3. Layout Global

### 3.1 TopNav
**Container**:
```css
[data-bs-theme="dark"] .hk-navbar {
  background-color: #0f172a;
  border-bottom: 1px solid transparent;
  box-shadow: 0 1px 0 0 rgba(59,130,246,0.16),
              0 4px 18px rgba(0,0,0,0.45);
  background-image: linear-gradient(180deg, rgba(59,130,246,0.04), transparent 60%);
}
```

**Ordem dos elementos (direita para esquerda)**:
1. **Avatar** — `Dropdown` com menu de perfil
2. **Chip Créditos** — `⚡ 1.045 créditos [+]`
3. **Chip Agente IA** — `💬 Agente IA` (abre painel)
4. **Chip Theme Switch** — `☀️ / 🌙` toggle
5. Logo + Search à esquerda

**Fórmula universal do chip** (copiar para qualquer novo chip):
```jsx
<div
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 14px 6px 12px',
    borderRadius: 999,
    background: isDark
      ? 'linear-gradient(135deg, #1c2748 0%, #141d35 100%)'
      : '#ffffff',
    border: isDark
      ? '1px solid rgba(59,130,246,0.22)'
      : '1px solid rgba(15,23,42,0.08)',
    boxShadow: isDark
      ? '0 4px 14px -6px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.03)'
      : '0 2px 8px -3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04)',
    cursor: 'pointer',
    transition: 'transform .15s ease, box-shadow .2s ease, border-color .2s ease',
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateY(-1px)';
    e.currentTarget.style.boxShadow = isDark
      ? '0 6px 18px -4px rgba(59,130,246,0.6), inset 0 1px 0 rgba(255,255,255,0.05)'
      : '0 4px 12px -4px rgba(15,23,42,0.15), 0 2px 4px rgba(15,23,42,0.08)';
    e.currentTarget.style.borderColor = isDark
      ? 'rgba(59,130,246,0.4)'
      : 'rgba(15,23,42,0.15)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = isDark
      ? '0 4px 14px -6px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.03)'
      : '0 2px 8px -3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04)';
    e.currentTarget.style.borderColor = isDark
      ? 'rgba(59,130,246,0.22)'
      : 'rgba(15,23,42,0.08)';
  }}
>
  {/* Conteúdo aqui */}
</div>
```

### 3.2 Sidebar (hk-menu)

**Container**:
```css
[data-bs-theme="dark"] .hk-menu {
  background-color: #0f172a;
  border-right: 1px solid rgba(59,130,246,0.14);
  box-shadow: inset -1px 0 0 rgba(59,130,246,0.06);
}
```

**Item ativo** (dark):
```css
background: linear-gradient(90deg,
              rgba(59,130,246,0.22),
              rgba(59,130,246,0.04) 70%,
              transparent);
color: #ffffff;
border-left: 3px solid #3b82f6;
border-radius: 0 10px 10px 0;
box-shadow: inset 0 0 0 1px rgba(59,130,246,0.18);
```

**Item hover (não-ativo)**:
```css
background: linear-gradient(90deg, rgba(59,130,246,0.12), transparent 80%);
color: #e9e4ff;  /* dark */ | #1e40af; /* light */
```

### 3.3 Dashboard

**Stat Cards — faixa superior gradient** (dark):
```css
.fm-body .card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg,
                transparent,
                #3b82f6 20%,
                #6366f1 60%,
                transparent);
  opacity: 0.55;
}
```

**Título da página**:
```jsx
<h4 className="fw-bold">Dashboard</h4>
```
No dark mode, recebe gradient text automaticamente via CSS global.

---

## 4. Componentes

### 4.1 Buttons

#### Primary (gradient)
```jsx
<Button variant="primary">Ação principal</Button>
```
- Background: gradient `#3b82f6 → #2563eb`
- Hover: gradient escurece para `#2563eb → #1d4ed8` + `translateY(-1px)` + sombra intensificada
- Uso: CTAs principais, submit, save

#### Outline
```jsx
<Button variant="outline-primary">Ação secundária</Button>
```
- Light: `color: #1d4ed8; border: #3b82f6; background: transparent`
- Hover: fill azul com texto branco

#### Soft (fundo tingido)
```jsx
<Button variant="soft-primary">Ação terciária</Button>
<Button variant="soft-success">Aprovar</Button>
<Button variant="soft-warning">Revisar</Button>
<Button variant="soft-danger">Excluir</Button>
```
- Light backgrounds com contraste AA garantido
- Dark mode: hover força `color: #ffffff`

#### Icon Rounded
```jsx
<Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover">
  <span className="icon">
    <span className="feather-icon"><Bell /></span>
  </span>
</Button>
```

#### CTA Circular (botão `+` dentro de chip)
```jsx
<Link
  href="/apps/billing"
  style={{
    width: 17, height: 17,
    borderRadius: 999,
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    boxShadow: '0 2px 6px -2px rgba(59,130,246,0.6)',
    border: '1px solid rgba(59,130,246,0.5)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    transition: 'transform .15s ease, box-shadow .2s ease',
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'scale(1.08)';
    e.currentTarget.style.boxShadow = '0 4px 12px -2px rgba(59,130,246,0.75)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.boxShadow = '0 2px 6px -2px rgba(59,130,246,0.6)';
  }}
>
  <Plus size={16} strokeWidth={2.5} color="#ffffff" />
</Link>
```

### 4.2 Cards

```jsx
<Card>
  <Card.Header>Título</Card.Header>
  <Card.Body>Conteúdo</Card.Body>
</Card>
```

**Dark mode**: border azul sutil `rgba(59,130,246,0.12)`, hover com glow azul. Card header tem gradient sutil superior.

**Stat card** (na pasta `.fm-body`): ganha automaticamente faixa gradient superior.

### 4.3 Badges

```jsx
<HkBadge bg="success" soft>Ativo</HkBadge>
<HkBadge bg="warning" soft>Pendente</HkBadge>
<HkBadge bg="primary" soft>Azul</HkBadge>
```

**Pill com gradient** (ex: "Versão BETA"):
```jsx
<HkBadge pill className="px-3 py-2 fw-bold fs-6" style={{
  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  color: '#ffffff',
  border: '1px solid rgba(59,130,246,0.5)',
  boxShadow: '0 4px 14px -4px rgba(59,130,246,0.55), inset 0 1px 0 rgba(255,255,255,0.15)'
}}>Versão BETA</HkBadge>
```

### 4.4 Forms

**Input/Select/Textarea** (dark):
```css
background: #1c2748;
border: 1px solid #2a2f3d;
color: #c9d1e0;
```

**Focus ring**:
```css
border-color: #3b82f6;
box-shadow: 0 0 0 0.2rem rgba(59,130,246,0.22);
```

### 4.5 Dropdowns / Modals

**Dark**:
```css
background: #141d35;
border: 1px solid #2a2f3d;
box-shadow: 0 4px 16px rgba(0,0,0,0.5);

/* item hover */
background: #1c2748;
color: #ffffff;
```

### 4.6 Tables (dark)
```css
--bs-table-bg: #141d35;
--bs-table-striped-bg: #232739;
--bs-table-hover-bg: #262b3c;
--bs-table-border-color: #2a2f3d;
color: #c9d1e0;
```

### 4.7 Tooltips (dark) — corrigido

```css
[data-bs-theme="dark"] .tooltip-inner {
  background-color: #1f2937;
  color: #ffffff;
  border: 1px solid rgba(59,130,246,0.3);
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}
[data-bs-theme="dark"] .tooltip .tooltip-arrow::before {
  border-top-color: #1f2937;
}
```

### 4.8 Alerts (light)
```css
.alert-primary {
  background: #eff6ff;
  border: 1px solid rgba(59,130,246,0.35);
  color: #1d4ed8;
}
```

---

## 5. Dark Mode — Regras Globais

1. **Hover de TODOS os botões (soft/outline/flush) → texto branco**
   ```css
   [data-bs-theme="dark"] .btn-*:hover { color: #ffffff !important; }
   ```
2. **Ícones SVG seguem o texto do botão**
   ```css
   [data-bs-theme="dark"] .btn:hover svg { color: #ffffff !important; stroke: #ffffff !important; }
   ```
3. **Auth pages (login/signup) SEMPRE em light**, mesmo com dark ativado — `.hk-pg-auth` força fundo branco.
4. **Teal/Cyan legados são remapeados para violeta** — `--bs-teal`, `--bs-cyan`, `--bs-info` todos viram `#3b82f6`.
5. **Atmosfera global**: dois radial gradients fixos em `body::before` dão profundidade sem interferir no conteúdo (z-index: 0).

---

## 6. Acessibilidade

- Contraste mínimo: **4.5:1** body, **3:1** texto ≥18px ou negrito ≥14px
- Focus visível em todos os controles: `box-shadow: 0 0 0 0.2rem rgba(59,130,246,0.22)`
- Tooltips com contraste alto (fundo `#1f2937`, texto branco) tanto dark como light
- Labels semânticos: `aria-label` em botões icon-only (ex: botão `+` de créditos, toggle de tema)

---

## 7. Do's & Don'ts (Guia para IA)

### ✅ DO

- **Use os tokens CSS** no lugar de hex hardcoded. Se precisar de azul primário, é `#3b82f6` ou `var(--tms-blue)`.
- **Padronize chips do TopNav** com `padding: 6px 14px 6px 12px` + `borderRadius: 999` + gradient dark `#1c2748 → #141d35`.
- **Dark mode primeiro**: ao criar componente, escreva os dois estilos com `isDark ? ... : ...`.
- **Hover sempre com lift** (`translateY(-1px)`) OU scale (`scale(1.08)`) para CTAs circulares.
- **Border azul sutil em cards dark**: `rgba(59,130,246,0.12)` default, `rgba(59,130,246,0.28)` hover.
- **Texto em dark mode com `color: #ffffff`** em elementos de alto destaque (chip labels, item ativo da sidebar).
- **Gradient `135deg, #3b82f6 0%, #2563eb 100%`** em CTAs primários.
- **Accent warning para números de destaque**: ícone Zap amarelo `#f59e0b` em chips que representam "saldo" ou "crédito".

### ❌ DON'T

- **NÃO usar teal/cyan/sky/info como cores distintas** — todos já foram remapeados para azul violeta. Use `primary`.
- **NÃO criar card dark sem borda azul sutil** — fica "flutuando" no background.
- **NÃO usar `.text-muted` puro em dark** — ele fica `#5a6480` e perde legibilidade. Use `#8d97b0` ou `#c9d1e0`.
- **NÃO colocar botão ou link com cor padrão dentro do TopNav** — use o padrão chip, ou ícone `btn-flush-dark` rounded.
- **NÃO duplicar inline styles** — se for um padrão repetido, adicione regra ao `landingIdentityScript` em `layout.js`.
- **NÃO usar purple gradients sobre branco** (clichê AI slop) — nosso violeta é sempre sobre deep indigo ou com borda.
- **NÃO usar roxo/púrpura saturado** — nossa paleta é azul-violeta (`#3b82f6`), não violeta puro.
- **NÃO remover as overrides de auth** — `/login`, `/signup` etc DEVEM permanecer em light mode.

---

## 8. Arquivos de Referência

| Arquivo | Papel |
|---------|-------|
| `src/app/layout.js` | 3 scripts runtime: `colorModeScript`, `themeInitScript`, `landingIdentityScript` (fonte da verdade para paleta) |
| `src/hooks/useColorMode.js` | Variáveis CSS dinâmicas + toggle dark/light |
| `src/layout/Header/TopNav.jsx` | Padrão de chips, switch de tema, assistente IA, créditos |
| `src/layout/VerticalLayouts/MenuContent.jsx` | Padrão de sidebar |
| `src/context/ThemeProvider.jsx` | Wrapper do tema no root |
| `src/styles/scss/style.scss` | Base SCSS compilada (não editar diretamente — overrides vão em `layout.js`) |

---

## 9. Snippets Prontos (Copy-Paste)

### 9.1 Chip de TopNav padrão
Ver seção **3.1** — a fórmula universal do chip já está pronta com hover handlers.

### 9.2 Stat Card de Dashboard
```jsx
<Card>
  <Card.Body>
    <div className="d-flex align-items-center justify-content-between mb-2">
      <span className="text-muted small">Total de Viagens</span>
      <TrendingUp size={16} color="#3b82f6" />
    </div>
    <h3 className="fw-bold mb-0">1.248</h3>
    <small className="text-success">+12% vs mês anterior</small>
  </Card.Body>
</Card>
```
A faixa gradient superior é aplicada automaticamente via CSS global quando dentro de `.fm-body`.

### 9.3 Botão Primário (gradient automático)
```jsx
<Button variant="primary">Salvar alterações</Button>
```

### 9.4 Input com focus ring azul
```jsx
<Form.Control type="text" placeholder="Buscar viagem..." />
```
Focus ring azul é aplicado via global CSS.

### 9.5 Página exemplo com dark mode consciente
```jsx
'use client';
import { useColorMode } from '@/hooks/useColorMode';

export default function MinhaPagina() {
  const { isDark } = useColorMode();

  return (
    <div className="container py-4">
      <h4 className="fw-bold mb-4">Minha Página</h4>
      <Card>
        <Card.Body>
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: isDark ? '#1c2748' : '#f8fafc',
              border: isDark
                ? '1px solid rgba(59,130,246,0.22)'
                : '1px solid rgba(15,23,42,0.08)',
            }}
          >
            Conteúdo destacado
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
```

### 9.6 Badge de status com gradient
```jsx
<HkBadge pill style={{
  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  color: '#fff',
  padding: '4px 10px',
  fontWeight: 600,
}}>
  Ativo
</HkBadge>
```

---

## 10. Checklist ao Criar Nova Página

- [ ] Página funciona em **dark E light** (testar com toggle no TopNav)
- [ ] Textos respeitam contraste AA nos dois temas
- [ ] Cards têm border azul sutil no dark
- [ ] CTAs primárias usam gradient `#3b82f6 → #2563eb`
- [ ] Estados de hover têm `translateY(-1px)` ou `scale(1.08)`
- [ ] Ícones vêm de `react-feather` (preferido) ou `tabler-icons-react`
- [ ] Nenhum hex hardcoded fora da paleta documentada aqui
- [ ] Nenhuma cor teal/cyan/sky usada como distintiva (todas viram azul)
- [ ] Focus ring visível em inputs e botões
- [ ] Tooltips legíveis em dark (texto branco sobre `#1f2937`)
- [ ] Página respeita o padrão de spacing (`gap-2`, chips com padding exato)

---

**Referência rápida para IA**: sempre consulte este arquivo (`DESIGN_SYSTEM.md` na raiz) antes de criar ou refatorar UI. Em caso de dúvida entre duas opções, escolha a que **já aparece neste documento**.
