import { DM_Sans } from 'next/font/google'
import { GlobalStateProvider } from '@/context/GolobalStateProvider';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { ThemeProvider } from '@/context/ThemeProvider';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-perfect-scrollbar/dist/css/styles.css';
import '@/styles/scss/style.scss';

// Font Family
const dm_sans = DM_Sans({
  weight: ["400", "500", "700"],
  display: "swap",
  subsets: ["latin"],
  variable: '--font-jampack'
})

// metadata
export const metadata = {
  title: 'OpenClaw SaaS | Painel de Agentes e Automações',
  description: 'Painel SaaS para autenticação, tenants, monitoramento, logs e operação de agentes OpenClaw.',
  keywords: ['OpenClaw', 'SaaS', 'Agentes', 'Automação', 'Tenants', 'Monitoramento', 'Logs', 'IA'],
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
  },
}


// Script 1: aplica dark/light mode antes do primeiro render (zero flash)
const colorModeScript = `
(function() {
  try {
    var mode = localStorage.getItem('voxx.colorMode');
    // Primeiro acesso (sem preferÃªncia salva) â†’ sempre inicia em modo claro
    if (mode !== 'dark') {
      mode = 'light';
    }
    var root = document.documentElement;
    root.setAttribute('data-bs-theme', mode);
    if (mode === 'dark') {
      var vars = {
        '--bs-body-bg': '#0f172a',
        '--bs-body-bg-rgb': '15,23,42',
        '--bs-body-color': '#c9d1e0',
        '--bs-body-color-rgb': '201,209,224',
        '--bs-border-color': '#2a2f3d',
        '--bs-border-color-translucent': 'rgba(255,255,255,0.08)',
        '--bs-secondary-bg': '#141d35',
        '--bs-secondary-bg-rgb': '20,29,53',
        '--bs-tertiary-bg': '#191c27',
        '--bs-emphasis-color': '#f0f3f8',
        '--bs-heading-color': '#dde3ef',
        '--bs-secondary-color': 'rgba(201,209,224,0.65)',
        '--bs-tertiary-color': 'rgba(201,209,224,0.40)',
        '--bs-link-color': '#7eb8ff',
        '--bs-black': '#c9d1e0',
      };
      Object.keys(vars).forEach(function(k) { root.style.setProperty(k, vars[k]); });
      var style = document.createElement('style');
      style.id = '__dark-mode-overrides__';
      style.textContent = [
        /* Auth pages: force light mode regardless of html[data-bs-theme] */
        '[data-bs-theme="dark"] .hk-pg-auth,[data-bs-theme="dark"] .hk-pg-auth .hk-pg-wrapper,[data-bs-theme="dark"] .hk-pg-auth .hk-pg-body{background-color:#fff !important;color:#212529 !important}',
        '[data-bs-theme="dark"] .hk-pg-auth .card,[data-bs-theme="dark"] .hk-pg-auth .card-body{background-color:#fff !important;color:#212529 !important;border-color:#dee2e6 !important}',
        '[data-bs-theme="dark"] .hk-pg-auth .form-control,[data-bs-theme="dark"] .hk-pg-auth .input-group-text{background-color:#fff !important;color:#212529 !important;border-color:#dee2e6 !important}',
        '[data-bs-theme="dark"] .hk-pg-auth h1,[data-bs-theme="dark"] .hk-pg-auth h2,[data-bs-theme="dark"] .hk-pg-auth h3,[data-bs-theme="dark"] .hk-pg-auth h4,[data-bs-theme="dark"] .hk-pg-auth h5,[data-bs-theme="dark"] .hk-pg-auth h6{color:#212529 !important}',
        '[data-bs-theme="dark"] .hk-pg-auth .text-muted{color:#6c757d !important}',
        '[data-bs-theme="dark"] .hk-pg-auth .form-label,[data-bs-theme="dark"] .hk-pg-auth label{color:#212529 !important}',
        '[data-bs-theme="dark"] .hk-pg-auth p,[data-bs-theme="dark"] .hk-pg-auth span:not(.badge):not(.btn){color:#212529 !important}',
        '[data-bs-theme="dark"] body,[data-bs-theme="dark"] .hk-pg-wrapper,[data-bs-theme="dark"] .hk-pg-body{background-color:#0f172a !important;color:#c9d1e0 !important}',
        '[data-bs-theme="dark"] .hk-pg-header{background:#1a1d27 !important;border-bottom-color:#2a2f3d !important}',
        '[data-bs-theme="dark"] .hk-navbar{background-color:#0f172a !important;border-bottom:1px solid #1e293b !important;box-shadow:0 1px 4px rgba(0,0,0,0.4) !important}',
        '[data-bs-theme="dark"] .fm-body{background-color:#0f172a !important}',
        '[data-bs-theme="dark"] .hk-menu{background-color:#0f172a !important;border-right:1px solid #1e293b !important}',
        '[data-bs-theme="dark"] .hk-menu .nicescroll-bar{background-color:#0f172a !important}',
        '[data-bs-theme="dark"] .hk-menu .navbar-nav .nav-link{color:#94a3b8 !important;gap:0.5rem !important}',
        '[data-bs-theme="dark"] .hk-menu .navbar-nav .nav-link:hover{color:#e2e8f0 !important;background-color:#1e293b !important}',
        '[data-bs-theme="dark"] .hk-menu .navbar-nav .nav-link.active,[data-bs-theme="dark"] .hk-menu .navbar-nav .nav-item.active > .nav-link{color:#ffffff !important;background-color:#1e293b !important;border-radius:0.5rem !important;border-left:3px solid var(--bs-primary,#22c55e) !important}',
        '[data-bs-theme="dark"] .hk-menu .navbar-nav .nav-link.active > *,[data-bs-theme="dark"] .hk-menu .navbar-nav .nav-item.active > .nav-link > *{color:#ffffff !important}',
        '[data-bs-theme="dark"] .hk-menu .navbar-nav .nav-link.active .svg-icon svg,[data-bs-theme="dark"] .hk-menu .navbar-nav .nav-item.active > .nav-link .svg-icon svg{stroke:#ffffff !important}',
        '[data-bs-theme="dark"] .hk-menu .badge{border:1px solid transparent !important}',
        '[data-bs-theme="dark"] .hk-menu .badge-soft-success,[data-bs-theme="dark"] .hk-menu .bg-success-light-5.badge{background-color:rgba(25,135,84,0.22) !important;color:#7ee2a8 !important;border-color:rgba(25,135,84,0.35) !important}',
        '[data-bs-theme="dark"] .hk-menu .badge-soft-danger,[data-bs-theme="dark"] .hk-menu .bg-danger-light-5.badge{background-color:rgba(220,53,69,0.22) !important;color:#ff9aa5 !important;border-color:rgba(220,53,69,0.35) !important}',
        '[data-bs-theme="dark"] .hk-menu .badge-soft-warning,[data-bs-theme="dark"] .hk-menu .bg-warning-light-5.badge{background-color:rgba(255,193,7,0.18) !important;color:#ffd86b !important;border-color:rgba(255,193,7,0.3) !important}',
        '[data-bs-theme="dark"] .hk-menu .badge-outline.badge-success{color:#00D67F !important;border-color:#00D67F !important;background:transparent !important}',
        '[data-bs-theme="dark"] .hk-menu .badge-outline.badge-danger{color:#ff4d4d !important;border-color:#ff4d4d !important;background:transparent !important}',
        '[data-bs-theme="dark"] .hk-menu .badge-outline.badge-warning{color:#FFC400 !important;border-color:#FFC400 !important;background:transparent !important}',
        '[data-bs-theme="dark"] .hk-menu .navbar-nav .nav-link .badge{font-weight:600 !important}',
        '[data-bs-theme="dark"] .card{background-color:#141d35 !important;border-color:#2a2f3d !important;color:#c9d1e0 !important;box-shadow:0 2px 8px rgba(0,0,0,0.35) !important}',
        '[data-bs-theme="dark"] .card-header{background-color:#1c2748 !important;border-bottom-color:#2a2f3d !important;color:#dde3ef !important}',
        '[data-bs-theme="dark"] .card-footer{background-color:#1c2748 !important;border-top-color:#2a2f3d !important}',
        '[data-bs-theme="dark"] .card .card-title{color:#dde3ef !important}',
        '[data-bs-theme="dark"] .card .card-body *:not(.badge):not(.btn){color:#c9d1e0 !important}',
        '[data-bs-theme="dark"] .card h1,[data-bs-theme="dark"] .card h2,[data-bs-theme="dark"] .card h3,[data-bs-theme="dark"] .card h4,[data-bs-theme="dark"] .card h5,[data-bs-theme="dark"] .card h6,[data-bs-theme="dark"] .card .h1,[data-bs-theme="dark"] .card .h2,[data-bs-theme="dark"] .card .h3,[data-bs-theme="dark"] .card .h4,[data-bs-theme="dark"] .card .h5,[data-bs-theme="dark"] .card .h6{color:#dde3ef !important}',
        '[data-bs-theme="dark"] .card .text-muted,[data-bs-theme="dark"] .card small.text-muted{color:#5a6480 !important}',
        '[data-bs-theme="dark"] .card .fw-medium,[data-bs-theme="dark"] .card .fw-bold{color:#dde3ef !important}',
        '[data-bs-theme="dark"] .table{--bs-table-bg:#141d35;--bs-table-striped-bg:#232739;--bs-table-hover-bg:#262b3c;--bs-table-border-color:#2a2f3d;color:#c9d1e0 !important;border-color:#2a2f3d !important}',
        '[data-bs-theme="dark"] .form-control,[data-bs-theme="dark"] .form-select,[data-bs-theme="dark"] textarea.form-control{background-color:#1c2748 !important;border-color:#2a2f3d !important;color:#c9d1e0 !important}',
        '[data-bs-theme="dark"] .input-group-text{background-color:#1c2748 !important;border-color:#2a2f3d !important;color:#8d97b0 !important}',
        '[data-bs-theme="dark"] .form-label{color:#9aa3bc !important}',
        '[data-bs-theme="dark"] .dropdown-menu{background-color:#141d35 !important;border-color:#2a2f3d !important;box-shadow:0 4px 16px rgba(0,0,0,0.5) !important}',
        '[data-bs-theme="dark"] .dropdown-item{color:#c9d1e0 !important}',
        '[data-bs-theme="dark"] .dropdown-item:hover,[data-bs-theme="dark"] .dropdown-item:focus{background-color:#1c2748 !important;color:#fff !important}',
        '[data-bs-theme="dark"] .modal-content{background-color:#141d35 !important;border-color:#2a2f3d !important;color:#c9d1e0 !important}',
        '[data-bs-theme="dark"] .modal-header{background-color:#1c2748 !important;border-bottom-color:#2a2f3d !important}',
        '[data-bs-theme="dark"] .list-group-item{background-color:#141d35 !important;border-color:#2a2f3d !important;color:#c9d1e0 !important}',
        '[data-bs-theme="dark"] .nav-tabs{border-bottom-color:#2a2f3d !important}',
        '[data-bs-theme="dark"] .nav-tabs .nav-link{color:#8d97b0 !important}',
        '[data-bs-theme="dark"] .nav-tabs .nav-link.active{background-color:#141d35 !important;border-color:#2a2f3d #2a2f3d #141d35 !important;color:#dde3ef !important}',
        '[data-bs-theme="dark"] .btn-white{background-color:#1c2748 !important;border-color:#2a2f3d !important;color:#c9d1e0 !important}',
        '[data-bs-theme="dark"] .btn-flush-dark{color:#c9d1e0 !important}',
        '[data-bs-theme="dark"] .btn-flush-dark:hover{background-color:#1c2748 !important}',
        '[data-bs-theme="dark"] .bg-light{background-color:#1c2748 !important;color:#c9d1e0 !important}',
        '[data-bs-theme="dark"] .bg-white{background-color:#141d35 !important}',
        '[data-bs-theme="dark"] .bg-body{background-color:#13151a !important}',
        '[data-bs-theme="dark"] .text-dark{color:#c9d1e0 !important}',
        '[data-bs-theme="dark"] .text-muted{color:#5a6480 !important}',
        '[data-bs-theme="dark"] .text-secondary{color:#7a84a0 !important}',
        '[data-bs-theme="dark"] .border{border-color:#2a2f3d !important}',
        '[data-bs-theme="dark"] hr{border-color:#2a2f3d !important;opacity:1 !important}',
        '[data-bs-theme="dark"] .simplebar-scrollbar::before{background-color:#3a4054 !important}',
        '[data-bs-theme="dark"] .hk-footer,[data-bs-theme="dark"] footer{background-color:#1a1d27 !important;border-top-color:#2a2f3d !important;color:#5a6480 !important}',
        '[data-bs-theme="dark"] .fmapp-wrap .fmapp-sidebar,[data-bs-theme="dark"] .chatapp-wrap .chatapp-aside,[data-bs-theme="dark"] .emailapp-wrap .emailapp-sidebar,[data-bs-theme="dark"] .calendarapp-wrap .calendarapp-sidebar,[data-bs-theme="dark"] .todoapp-wrap .todoapp-sidebar,[data-bs-theme="dark"] .invoiceapp-wrap .invoiceapp-sidebar{background:#1a1d27 !important;border-right-color:#2a2f3d !important;color:#c9d1e0 !important}',
        '[data-bs-theme="dark"] .fmapp-wrap .fmapp-content,[data-bs-theme="dark"] .chatapp-wrap .chatapp-single-chat,[data-bs-theme="dark"] .emailapp-wrap .emailapp-content,[data-bs-theme="dark"] .calendarapp-wrap .calendarapp-content,[data-bs-theme="dark"] .todoapp-wrap .todoapp-content,[data-bs-theme="dark"] .invoiceapp-wrap .invoiceapp-content{background:#0f172a !important;border-color:#2a2f3d !important;color:#c9d1e0 !important}',
        '[data-bs-theme="dark"] .fmapp-wrap .navbar-nav .nav-link,[data-bs-theme="dark"] .emailapp-wrap .navbar-nav .nav-link,[data-bs-theme="dark"] .calendarapp-wrap .navbar-nav .nav-link,[data-bs-theme="dark"] .todoapp-wrap .navbar-nav .nav-link{color:#8d97b0 !important}',
        '[data-bs-theme="dark"] .chatapp-wrap .chat-body{background:#13151a !important}',
        '[data-bs-theme="dark"] .chatapp-wrap .chat-footer,[data-bs-theme="dark"] .fmapp-wrap .fmapp-storage,[data-bs-theme="dark"] .fmapp-wrap .fmapp-fixednav{background:#141d35 !important;border-top-color:#2a2f3d !important;border-bottom-color:#2a2f3d !important}',
        '[data-bs-theme="dark"] .fmapp-detail-wrap,[data-bs-theme="dark"] .fmapp-wrap .fmapp-detail-wrap,[data-bs-theme="dark"] .fmapp-wrap .fmapp-content .fmapp-detail-wrap{background:#0f172a !important;color:#c9d1e0 !important}',
        '[data-bs-theme="dark"] .emailapp-wrap .emailapp-detail-wrap,[data-bs-theme="dark"] .emailapp-wrap .emailapp-content .emailapp-detail-wrap,[data-bs-theme="dark"] .invoiceapp-wrap .invoiceapp-detail-wrap{background:#0f172a !important;border-left-color:#2a2f3d !important;color:#c9d1e0 !important}',
        '[data-bs-theme="dark"] .fmapp-wrap .fm-header,[data-bs-theme="dark"] .fmapp-wrap header.fm-header{background:linear-gradient(180deg,#141d35 0%,#111a30 100%) !important;border-bottom:1px solid rgba(59,130,246,0.16) !important;box-shadow:0 1px 0 rgba(255,255,255,0.02) inset,0 10px 30px rgba(2,6,23,0.30) !important;color:#dde3ef !important}',
        '[data-bs-theme="dark"] .integrationsapp-wrap .integrationsapp-sidebar{background:#1a1d27 !important;border-right-color:#2a2f3d !important;color:#c9d1e0 !important}',
        '[data-bs-theme="dark"] .integrationsapp-wrap .integrationsapp-sidebar .nicescroll-bar,[data-bs-theme="dark"] .integrationsapp-wrap .integrationsapp-sidebar .menu-content-wrap{background:#1a1d27 !important}',
        '[data-bs-theme="dark"] .integrationsapp-wrap .integrationsapp-content,[data-bs-theme="dark"] .integrationsapp-wrap .integrationsapp-detail-wrap,[data-bs-theme="dark"] .integrationsapp-wrap .integrations-body,[data-bs-theme="dark"] .integrationsapp-wrap .integrations-body .nicescroll-bar{background:#13151a !important;border-color:#2a2f3d !important;color:#c9d1e0 !important}',
        '[data-bs-theme="dark"] .integrationsapp-wrap header.integrations-header{background:#13151a !important;border-bottom-color:#2a2f3d !important;color:#c9d1e0 !important}',
        '[data-bs-theme="dark"] .integrationsapp-wrap .integrationsapp-title,[data-bs-theme="dark"] .integrationsapp-wrap .integrationsapp-title h1,[data-bs-theme="dark"] .integrationsapp-wrap .nav-header span{color:#dde3ef !important}',
        '[data-bs-theme="dark"] .integrationsapp-wrap .navbar-nav .nav-link,[data-bs-theme="dark"] .integrationsapp-wrap .menu-group > .navbar-nav > .nav-item > .nav-link{color:#8d97b0 !important}',
        '[data-bs-theme="dark"] .integrationsapp-wrap .navbar-nav .nav-link:hover,[data-bs-theme="dark"] .integrationsapp-wrap .navbar-nav .nav-link:focus{background-color:#1c2748 !important;color:#dde3ef !important}',
        '[data-bs-theme="dark"] .integrationsapp-wrap .navbar-nav .nav-link.active{background-color:#1c2748 !important;color:#dde3ef !important}',
        '[data-bs-theme="dark"] .integrationsapp-wrap .form-control{background-color:#1c2748 !important;border-color:#2a2f3d !important;color:#c9d1e0 !important}',
        '[data-bs-theme="dark"] .integrationsapp-wrap .text-muted,[data-bs-theme="dark"] .integrationsapp-wrap small.text-muted{color:#7a84a0 !important}',

        /* ───────────────────────────────────────────────
           LANDING PAGE VISUAL IDENTITY (violet/indigo accents)
           Mantém o background #0f172a, mas traz a paleta roxa
           da landing com gradientes, glow, cards refinados.
           ─────────────────────────────────────────────── */
        /* 1. Paleta violeta centralizada */
        '[data-bs-theme="dark"]{--tms-blue:#3b82f6;--tms-blue-strong:#2563eb;--tms-blue-soft:rgba(59,130,246,0.14);--tms-blue-glow:rgba(59,130,246,0.35);--tms-indigo:#6366f1;--tms-pink:#6366f1;--tms-surface:#141d35;--tms-surface-2:#1c2748;--tms-border-violet:rgba(59,130,246,0.22)}',

        /* 2. Fundo do app com atmosfera sutil — radial gradients em violeta no canto superior */
        '[data-bs-theme="dark"] body::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(1200px 600px at 85% -10%,rgba(59,130,246,0.10),transparent 60%),radial-gradient(900px 500px at 5% 100%,rgba(99,102,241,0.08),transparent 55%);}',
        '[data-bs-theme="dark"] .hk-pg-wrapper,[data-bs-theme="dark"] .fm-body{position:relative;z-index:1}',

        /* 3. TopNav — linha inferior com gradiente violeta sutil */
        '[data-bs-theme="dark"] .hk-navbar{border-bottom:1px solid transparent !important;box-shadow:0 1px 0 0 rgba(59,130,246,0.16),0 4px 18px rgba(0,0,0,0.45) !important;background-image:linear-gradient(180deg,rgba(59,130,246,0.04),transparent 60%) !important;background-color:#0f172a !important}',

        /* 4. Sidebar — borda direita com glow violeta + item ativo em roxo */
        '[data-bs-theme="dark"] .hk-menu{border-right:1px solid rgba(59,130,246,0.14) !important;box-shadow:inset -1px 0 0 rgba(59,130,246,0.06)}',
        '[data-bs-theme="dark"] .hk-menu .navbar-nav .nav-link.active,[data-bs-theme="dark"] .hk-menu .navbar-nav .nav-item.active > .nav-link{background:linear-gradient(90deg,rgba(59,130,246,0.22),rgba(59,130,246,0.04) 70%,transparent) !important;color:#ffffff !important;border-left:3px solid #3b82f6 !important;border-radius:0 10px 10px 0 !important;box-shadow:inset 0 0 0 1px rgba(59,130,246,0.18) !important}',
        '[data-bs-theme="dark"] .hk-menu .navbar-nav .nav-link:hover{background:linear-gradient(90deg,rgba(59,130,246,0.12),transparent 80%) !important;color:#e9e4ff !important}',

        /* 5. Cards — superfície levemente mais quente + borda violeta sutil + hover com glow */
        '[data-bs-theme="dark"] .card{background-color:#141d35 !important;border:1px solid rgba(59,130,246,0.12) !important;border-radius:14px !important;box-shadow:0 1px 0 rgba(255,255,255,0.02) inset,0 10px 30px rgba(2,6,23,0.55) !important;transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease}',
        '[data-bs-theme="dark"] .card:hover{border-color:rgba(59,130,246,0.28) !important;box-shadow:0 1px 0 rgba(255,255,255,0.03) inset,0 18px 44px rgba(2,6,23,0.6),0 0 0 1px rgba(59,130,246,0.12),0 0 40px -10px rgba(59,130,246,0.35) !important}',
        '[data-bs-theme="dark"] .card-header{background:linear-gradient(180deg,rgba(59,130,246,0.06),transparent) !important;border-bottom-color:rgba(59,130,246,0.12) !important}',

        /* 6. Stat cards do Dashboard — faixa de gradiente no topo (como na landing) */
        '[data-bs-theme="dark"] .fm-body .card{position:relative;overflow:hidden}',
        '[data-bs-theme="dark"] .fm-body .card::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#3b82f6 20%,#6366f1 60%,transparent);opacity:.55;pointer-events:none}',

        /* 7. Botões primary — gradiente violeta da landing */
        '[data-bs-theme="dark"] .btn-primary{background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%) !important;border-color:transparent !important;color:#fff !important;box-shadow:0 6px 18px -6px rgba(59,130,246,0.6) !important}',
        '[data-bs-theme="dark"] .btn-primary:hover,[data-bs-theme="dark"] .btn-primary:focus{background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%) !important;box-shadow:0 10px 28px -6px rgba(59,130,246,0.7) !important;transform:translateY(-1px)}',
        '[data-bs-theme="dark"] .btn-outline-primary{color:#93c5fd !important;border-color:rgba(59,130,246,0.45) !important;background:transparent !important}',
        '[data-bs-theme="dark"] .btn-outline-primary:hover{background:linear-gradient(135deg,rgba(59,130,246,0.18),rgba(59,130,246,0.06)) !important;border-color:#3b82f6 !important;color:#fff !important}',
        '[data-bs-theme="dark"] .btn-soft-primary{background:rgba(59,130,246,0.14) !important;color:#93c5fd !important;border-color:transparent !important}',
        '[data-bs-theme="dark"] .btn-soft-primary:hover{background:rgba(59,130,246,0.22) !important;color:#fff !important}',

        /* 8. Links e text-primary alinhados à paleta */
        '[data-bs-theme="dark"] a,[data-bs-theme="dark"] .link-primary{color:#60a5fa !important}',
        '[data-bs-theme="dark"] a:hover,[data-bs-theme="dark"] .link-primary:hover{color:#93c5fd !important}',
        '[data-bs-theme="dark"] .text-primary{color:#60a5fa !important}',

        /* 9. Badges e focus rings refinados */
        '[data-bs-theme="dark"] .badge.bg-primary,[data-bs-theme="dark"] .badge-primary{background:linear-gradient(135deg,#3b82f6,#2563eb) !important;color:#fff !important}',
        '[data-bs-theme="dark"] .form-control:focus,[data-bs-theme="dark"] .form-select:focus{border-color:#3b82f6 !important;box-shadow:0 0 0 0.2rem rgba(59,130,246,0.22) !important}',

        /* 10. Header do Dashboard — micro aura roxa no título */
        '[data-bs-theme="dark"] .fm-body h4.fw-bold{background:linear-gradient(135deg,#ffffff 0%,#93c5fd 100%);-webkit-background-clip:text;background-clip:text;color:transparent !important;letter-spacing:-0.01em}',

        /* 11. Override GLOBAL da cor primária (teal → violeta da landing)
           Afeta todo o SaaS: --bs-primary, --bs-teal (alias usado em vários lugares),
           links, btn-primary, bg-primary, text-primary, border-primary, active items. */
        '[data-bs-theme="dark"]{--bs-primary:#3b82f6 !important;--bs-primary-rgb:59,130,246 !important;--bs-teal:#3b82f6 !important;--bs-teal-rgb:59,130,246 !important;--bs-link-color:#60a5fa !important;--bs-link-hover-color:#93c5fd !important;--bs-link-color-rgb:96,165,250 !important}',
        '[data-bs-theme="dark"] .bg-primary,[data-bs-theme="dark"] .bg-teal{background-color:#3b82f6 !important;color:#fff !important}',
        '[data-bs-theme="dark"] .text-teal{color:#60a5fa !important}',
        '[data-bs-theme="dark"] .border-primary,[data-bs-theme="dark"] .border-teal{border-color:#3b82f6 !important}',
        '[data-bs-theme="dark"] .btn-teal{background:linear-gradient(135deg,#3b82f6,#2563eb) !important;border-color:transparent !important;color:#fff !important}',
        '[data-bs-theme="dark"] .btn-outline-teal{color:#93c5fd !important;border-color:rgba(59,130,246,0.5) !important}',
        '[data-bs-theme="dark"] .btn-soft-teal{background:rgba(59,130,246,0.14) !important;color:#93c5fd !important}',
        /* Active sidebar border — força violeta (useColorMode.js usa var(--bs-primary,#22c55e)) */
        '[data-bs-theme="dark"] .hk-menu .navbar-nav .nav-link.active,[data-bs-theme="dark"] .hk-menu .navbar-nav .nav-item.active > .nav-link{border-left-color:#3b82f6 !important}',
        /* Ícones/SVGs com stroke teal — pinta de violeta */
        '[data-bs-theme="dark"] [class*="svg-icon"] svg[stroke="#007D88"],[data-bs-theme="dark"] svg [stroke="#007D88"]{stroke:#3b82f6 !important}',
        '[data-bs-theme="dark"] [class*="svg-icon"] svg[fill="#007D88"],[data-bs-theme="dark"] svg [fill="#007D88"]{fill:#3b82f6 !important}',
      ].join('\\n');
      document.head.appendChild(style);
    }
  } catch(e) {}
})();
`;

// Script 2: aplica cores do partido (tema) antes do primeiro render (zero flash)
const themeInitScript = `
(function() {
  try {
    var raw = localStorage.getItem('voxx.theme');
    if (!raw) return;
    var parsed = JSON.parse(raw);
    var ttl = 60 * 60 * 1000;
    var CACHE_VERSION = 2;
    if (!parsed || !parsed.data || parsed.v !== CACHE_VERSION || (Date.now() - parsed.ts) > ttl) return;
    var d = parsed.data;
    var primary = d.primaryColor;
    var secondary = d.secondaryColor;
    if (!primary && !secondary) return;

    function hexToRgb(hex) {
      if (!hex) return null;
      var c = hex.replace('#', '');
      if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
      if (c.length !== 6) return null;
      var r = parseInt(c.slice(0,2),16), g = parseInt(c.slice(2,4),16), b = parseInt(c.slice(4,6),16);
      return isNaN(r)||isNaN(g)||isNaN(b) ? null : r+', '+g+', '+b;
    }
    function darken(hex, pct) {
      if (!hex) return hex;
      var c = hex.replace('#','');
      if (c.length !== 6) return hex;
      var f = 1 - pct/100;
      var r = Math.round(parseInt(c.slice(0,2),16)*f);
      var g = Math.round(parseInt(c.slice(2,4),16)*f);
      var b = Math.round(parseInt(c.slice(4,6),16)*f);
      return '#'+r.toString(16).padStart(2,'0')+g.toString(16).padStart(2,'0')+b.toString(16).padStart(2,'0');
    }
    function lighten(hex, pct) {
      if (!hex) return hex;
      var c = hex.replace('#','');
      if (c.length !== 6) return hex;
      var f = pct/100;
      var r = Math.round(parseInt(c.slice(0,2),16)+(255-parseInt(c.slice(0,2),16))*f);
      var g = Math.round(parseInt(c.slice(2,4),16)+(255-parseInt(c.slice(2,4),16))*f);
      var b = Math.round(parseInt(c.slice(4,6),16)+(255-parseInt(c.slice(4,6),16))*f);
      return '#'+r.toString(16).padStart(2,'0')+g.toString(16).padStart(2,'0')+b.toString(16).padStart(2,'0');
    }

    var css = [];
    if (primary) {
      var d1 = darken(primary,10), l3 = lighten(primary,60), l5 = lighten(primary,92), rgb = hexToRgb(primary);
      css.push(
        '.btn-primary{background-color:'+primary+' !important;border-color:'+primary+' !important;color:#fff !important}',
        '.btn-primary:hover,.btn-primary:focus{background-color:'+d1+' !important;border-color:'+d1+' !important;color:#fff !important}',
        '.btn-primary.disabled,.btn-primary:disabled{background-color:'+l3+' !important;border-color:'+l3+' !important}',
        '.btn-flush-primary{color:'+primary+' !important}',
        '.btn-flush-primary:hover,.btn-flush-primary:focus{background-color:'+primary+' !important;color:#fff !important}',
        '.btn-flush-primary.flush-soft-hover:hover,.btn-flush-primary.flush-soft-hover:focus{color:'+primary+' !important;background-color:'+l5+' !important}',
        '.bg-primary{background-color:'+primary+' !important}',
        '.bg-primary-light-5{background-color:'+l5+' !important}',
        '.bg-primary-light-3{background-color:'+l3+' !important}',
        '.bg-primary-dark-1{background-color:'+d1+' !important}',
        '.text-primary{color:'+primary+' !important}',
        '.link-primary{color:'+primary+' !important}',
        '.link-primary:hover{color:'+d1+' !important}',
        '.border-primary{border-color:'+primary+' !important}',
        '.navbar-nav .nav-link.active,.nav-pills .nav-link.active,.nav-pills .show>.nav-link{background-color:'+primary+' !important;color:#fff !important}',
        '.hk-menu .navbar-nav .nav-link.active,.hk-menu .navbar-nav .nav-item.active>.nav-link{background-color:#f0fdf4 !important;color:'+primary+' !important;border-left:3px solid '+primary+' !important;border-radius:0.5rem !important}',
        '.form-check-input:checked{background-color:'+primary+' !important;border-color:'+primary+' !important}',
        (rgb ? '.form-control:focus,.form-select:focus{border-color:'+primary+' !important;box-shadow:0 0 0 0.2rem rgba('+rgb+',0.25) !important}' : ''),
        ':root{--party-primary:'+primary+';--bs-primary:'+primary+';'+(rgb?'--bs-primary-rgb:'+rgb+';--party-primary-rgb:'+rgb+';':'')+'--bs-link-color:'+primary+';--bs-link-hover-color:'+d1+'}'
      );
    }
    if (secondary) {
      var d1s = darken(secondary,10), rgbs = hexToRgb(secondary);
      css.push(
        '.btn-secondary{background-color:'+secondary+' !important;border-color:'+secondary+' !important;color:#fff !important}',
        '.btn-secondary:hover,.btn-secondary:focus{background-color:'+d1s+' !important;border-color:'+d1s+' !important;color:#fff !important}',
        '.bg-secondary{background-color:'+secondary+' !important}',
        '.text-secondary{color:'+secondary+' !important}',
        '.border-secondary{border-color:'+secondary+' !important}',
        ':root{--party-secondary:'+secondary+';--bs-secondary:'+secondary+';'+(rgbs?'--bs-secondary-rgb:'+rgbs+';':'')+'}'
      );
    }

    if (css.length === 0) return;
    var style = document.createElement('style');
    style.id = '__party-theme-overrides__';
    style.textContent = css.join('\\n');
    document.head.appendChild(style);
  } catch(e) {}
})();
`;

// Script 3: LANDING IDENTITY — substitui azuis/teal/cyan/info por violeta GLOBALMENTE
// (light + dark) injetado por último para vencer os demais overrides.
const landingIdentityScript = `
(function() {
  try {
    var css = [
      /* Paleta violeta em :root (vale light + dark) */
      ':root{--tms-blue:#3b82f6;--tms-blue-strong:#2563eb;--tms-blue-soft:#60a5fa;--tms-blue-pale:#93c5fd;--bs-primary:#3b82f6 !important;--bs-primary-rgb:59,130,246 !important;--bs-teal:#3b82f6 !important;--bs-teal-rgb:59,130,246 !important;--bs-blue:#3b82f6 !important;--bs-blue-rgb:59,130,246 !important;--bs-cyan:#3b82f6 !important;--bs-cyan-rgb:59,130,246 !important;--bs-info:#3b82f6 !important;--bs-info-rgb:59,130,246 !important;--bs-indigo:#2563eb !important;--bs-link-color:#2563eb !important;--bs-link-hover-color:#1d4ed8 !important}',

      /* Backgrounds sólidos */
      '.bg-primary,.bg-teal,.bg-blue,.bg-sky,.bg-cyan,.bg-info{background-color:#3b82f6 !important;color:#fff !important}',
      /* Backgrounds soft/light */
      '.bg-primary-light-5,.bg-teal-light-5,.bg-blue-light-5,.bg-sky-light-5,.bg-cyan-light-5,.bg-info-light-5{background-color:#eff6ff !important;color:#2563eb !important}',
      '.bg-primary-light-4,.bg-teal-light-4,.bg-blue-light-4,.bg-sky-light-4,.bg-cyan-light-4,.bg-info-light-4{background-color:#dbeafe !important;color:#2563eb !important}',

      /* Texto */
      '.text-primary,.text-teal,.text-blue,.text-sky,.text-cyan,.text-info{color:#2563eb !important}',

      /* Bordas */
      '.border-primary,.border-teal,.border-blue,.border-sky,.border-cyan,.border-info{border-color:#3b82f6 !important}',

      /* Botões sólidos — gradiente sutil + sombra que dá "levantamento" */
      '.btn-primary,.btn-teal,.btn-blue,.btn-sky,.btn-cyan,.btn-info{background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%) !important;border:1px solid transparent !important;color:#fff !important;box-shadow:0 4px 12px -4px rgba(59,130,246,0.5),0 1px 2px rgba(37,99,235,0.15) !important;transition:transform .15s ease,box-shadow .2s ease,background .2s ease !important}',
      '.btn-primary:hover,.btn-teal:hover,.btn-blue:hover,.btn-sky:hover,.btn-cyan:hover,.btn-info:hover,.btn-primary:focus,.btn-teal:focus,.btn-blue:focus,.btn-sky:focus,.btn-cyan:focus,.btn-info:focus{background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%) !important;box-shadow:0 8px 20px -6px rgba(59,130,246,0.6),0 2px 4px rgba(37,99,235,0.2) !important;transform:translateY(-1px) !important;color:#fff !important}',
      '.btn-primary:active,.btn-teal:active,.btn-blue:active,.btn-sky:active,.btn-cyan:active,.btn-info:active{transform:translateY(0) !important;box-shadow:0 2px 6px -2px rgba(59,130,246,0.5) !important}',

      /* Botões outline — azul/violeta (light mode) */
      '.btn-outline-primary,.btn-outline-teal,.btn-outline-blue,.btn-outline-sky,.btn-outline-cyan,.btn-outline-info{color:#1d4ed8 !important;border:1px solid #3b82f6 !important;background:transparent !important}',
      '.btn-outline-primary:hover,.btn-outline-teal:hover,.btn-outline-blue:hover,.btn-outline-sky:hover,.btn-outline-cyan:hover,.btn-outline-info:hover{background:#3b82f6 !important;color:#fff !important;border-color:#3b82f6 !important}',

      /* Botões soft — paleta violeta/azul da landing (contraste AA) */
      '.btn-soft-primary,.btn-soft-teal,.btn-soft-blue,.btn-soft-sky,.btn-soft-cyan,.btn-soft-info{background:#dbeafe !important;color:#1e40af !important;border:1px solid rgba(59,130,246,0.25) !important}',
      '.btn-soft-primary:hover,.btn-soft-teal:hover,.btn-soft-blue:hover,.btn-soft-sky:hover,.btn-soft-cyan:hover,.btn-soft-info:hover{background:#bfdbfe !important;color:#1e3a8a !important;border-color:rgba(59,130,246,0.45) !important}',

      /* Botões soft — success / warning / danger / secondary (contraste AA) */
      '.btn-soft-success{background:#dcfce7 !important;color:#166534 !important;border:1px solid rgba(34,197,94,0.28) !important}',
      '.btn-soft-success:hover{background:#bbf7d0 !important;color:#14532d !important;border-color:rgba(34,197,94,0.5) !important}',
      '.btn-soft-warning{background:#fef3c7 !important;color:#92400e !important;border:1px solid rgba(245,158,11,0.32) !important}',
      '.btn-soft-warning:hover{background:#fde68a !important;color:#78350f !important;border-color:rgba(245,158,11,0.55) !important}',
      '.btn-soft-danger{background:#fee2e2 !important;color:#991b1b !important;border:1px solid rgba(239,68,68,0.32) !important}',
      '.btn-soft-danger:hover{background:#fecaca !important;color:#7f1d1d !important;border-color:rgba(239,68,68,0.55) !important}',
      '.btn-soft-secondary{background:#e2e8f0 !important;color:#334155 !important;border:1px solid rgba(100,116,139,0.25) !important}',
      '.btn-soft-secondary:hover{background:#cbd5e1 !important;color:#1e293b !important;border-color:rgba(100,116,139,0.45) !important}',
      '.btn-soft-dark{background:#e2e8f0 !important;color:#1e293b !important;border:1px solid rgba(15,23,42,0.18) !important}',
      '.btn-soft-dark:hover{background:#cbd5e1 !important;color:#0f172a !important}',

      /* Botões flush */
      '.btn-flush-primary,.btn-flush-teal,.btn-flush-blue,.btn-flush-sky,.btn-flush-cyan,.btn-flush-info{color:#2563eb !important}',
      '.btn-flush-primary:hover,.btn-flush-teal:hover,.btn-flush-blue:hover,.btn-flush-sky:hover,.btn-flush-cyan:hover,.btn-flush-info:hover{background-color:#3b82f6 !important;color:#fff !important}',

      /* Badges */
      '.badge.bg-primary,.badge.bg-teal,.badge.bg-blue,.badge.bg-sky,.badge.bg-cyan,.badge.bg-info,.badge-primary,.badge-teal,.badge-blue,.badge-sky,.badge-cyan,.badge-info{background-color:#3b82f6 !important;color:#fff !important}',
      '.badge-soft-primary,.badge-soft-teal,.badge-soft-blue,.badge-soft-sky,.badge-soft-cyan,.badge-soft-info{background:#dbeafe !important;color:#1e40af !important;border-color:rgba(59,130,246,0.3) !important}',
      '.badge-soft-success{background:#dcfce7 !important;color:#166534 !important;border-color:rgba(34,197,94,0.3) !important}',
      '.badge-soft-warning{background:#fef3c7 !important;color:#92400e !important;border-color:rgba(245,158,11,0.35) !important}',
      '.badge-soft-danger{background:#fee2e2 !important;color:#991b1b !important;border-color:rgba(239,68,68,0.35) !important}',
      '.badge-soft-secondary{background:#e2e8f0 !important;color:#334155 !important;border-color:rgba(100,116,139,0.25) !important}',
      '.badge-outline.badge-primary,.badge-outline.badge-teal,.badge-outline.badge-blue,.badge-outline.badge-sky,.badge-outline.badge-cyan,.badge-outline.badge-info{color:#2563eb !important;border-color:#3b82f6 !important;background:transparent !important}',

      /* Sidebar active — light: gradient sutil + borda lateral + sombra interna premium */
      '.hk-menu .navbar-nav .nav-link.active,.hk-menu .navbar-nav .nav-item.active>.nav-link{color:#1d4ed8 !important;background:linear-gradient(90deg,rgba(59,130,246,0.14),rgba(59,130,246,0.02) 75%,transparent) !important;border-left:3px solid #3b82f6 !important;border-radius:0 10px 10px 0 !important;box-shadow:inset 0 0 0 1px rgba(59,130,246,0.12) !important;font-weight:600 !important}',
      '.hk-menu .navbar-nav .nav-link.active .nav-icon-wrap,.hk-menu .navbar-nav .nav-item.active>.nav-link .nav-icon-wrap{color:#2563eb !important}',
      '.hk-menu .navbar-nav .nav-link:hover:not(.active){background:linear-gradient(90deg,rgba(59,130,246,0.08),transparent 85%) !important;color:#1e40af !important;border-radius:0 8px 8px 0 !important}',

      /* TopNav — sombra elegante em light mode + linha gradient sutil na base */
      '[data-bs-theme="light"] .hk-navbar,html:not([data-bs-theme="dark"]) .hk-navbar{border-bottom:1px solid transparent !important;box-shadow:0 1px 0 rgba(59,130,246,0.08),0 6px 20px -8px rgba(15,23,42,0.12) !important;background-image:linear-gradient(180deg,rgba(59,130,246,0.018),transparent 70%) !important}',

      /* Cards light mode — sombra suave + borda discreta azul no topo */
      '[data-bs-theme="light"] .card,html:not([data-bs-theme="dark"]) .card{border:1px solid rgba(59,130,246,0.08) !important;border-radius:12px !important;box-shadow:0 1px 2px rgba(15,23,42,0.04),0 4px 14px -6px rgba(15,23,42,0.08) !important;transition:transform .2s ease,box-shadow .25s ease,border-color .25s ease !important}',
      '[data-bs-theme="light"] .card:hover,html:not([data-bs-theme="dark"]) .card:hover{border-color:rgba(59,130,246,0.2) !important;box-shadow:0 4px 8px rgba(15,23,42,0.06),0 12px 28px -10px rgba(59,130,246,0.18) !important}',

      /* Links */
      '.link-primary,.link-teal,.link-blue,.link-sky,.link-cyan,.link-info{color:#2563eb !important}',
      '.link-primary:hover,.link-teal:hover,.link-blue:hover,.link-sky:hover,.link-cyan:hover,.link-info:hover{color:#1d4ed8 !important}',

      /* Alerts info */
      '.alert-primary,.alert-teal,.alert-blue,.alert-sky,.alert-cyan,.alert-info{background-color:#eff6ff !important;border-color:rgba(59,130,246,0.35) !important;color:#1d4ed8 !important}',

      /* Form focus */
      '.form-control:focus,.form-select:focus,.form-check-input:focus{border-color:#3b82f6 !important;box-shadow:0 0 0 0.2rem rgba(59,130,246,0.22) !important}',
      '.form-check-input:checked{background-color:#3b82f6 !important;border-color:#3b82f6 !important}',

      /* Nav pills / tabs */
      '.nav-pills .nav-link{color:var(--bs-body-color) !important;border-radius:10px !important;transition:background-color .2s ease,color .2s ease,box-shadow .2s ease !important}',
      '.nav-pills .nav-link:hover:not(.active){background:rgba(59,130,246,0.10) !important;color:#1d4ed8 !important}',
      '.nav-pills .nav-link.active,.nav-pills .show>.nav-link{background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%) !important;color:#fff !important;box-shadow:0 6px 16px -6px rgba(59,130,246,0.55),0 1px 2px rgba(37,99,235,0.18) !important}',
      '[data-bs-theme="dark"] .nav-pills .nav-link{color:#c9d1e0 !important}',
      '[data-bs-theme="dark"] .nav-pills .nav-link:hover:not(.active){background:rgba(59,130,246,0.16) !important;color:#e9e4ff !important}',
      '[data-bs-theme="dark"] .bg-primary-subtle,[data-bs-theme="dark"] .bg-info-subtle{background-color:rgba(59,130,246,0.14) !important;color:#c9d1e0 !important}',
      '[data-bs-theme="dark"] .bg-success-subtle{background-color:rgba(34,197,94,0.14) !important;color:#c9d1e0 !important}',
      '[data-bs-theme="dark"] .bg-warning-subtle{background-color:rgba(245,158,11,0.14) !important;color:#c9d1e0 !important}',
      '[data-bs-theme="dark"] .bg-danger-subtle{background-color:rgba(239,68,68,0.14) !important;color:#c9d1e0 !important}',
      '[data-bs-theme="dark"] .bg-secondary-subtle,[data-bs-theme="dark"] .bg-light-subtle{background-color:rgba(148,163,184,0.10) !important;color:#c9d1e0 !important}',

      /* Progress */
      '.progress-bar.bg-primary,.progress-bar.bg-teal,.progress-bar.bg-blue,.progress-bar.bg-sky,.progress-bar.bg-cyan,.progress-bar.bg-info{background-color:#3b82f6 !important}',

      /* Spinner */
      '.spinner-border.text-primary,.spinner-border.text-teal,.spinner-border.text-blue,.spinner-border.text-sky,.spinner-border.text-cyan,.spinner-border.text-info{color:#3b82f6 !important}',

      /* SVGs com cores antigas hardcoded */
      'svg [stroke="#007D88"],svg [stroke="#298DFF"],svg [stroke="#00B0FF"],svg [stroke="#18DDEF"]{stroke:#3b82f6 !important}',
      'svg [fill="#007D88"],svg [fill="#298DFF"],svg [fill="#00B0FF"],svg [fill="#18DDEF"]{fill:#3b82f6 !important}',

      /* DARK mode — ajustes finos para legibilidade */
      '[data-bs-theme="dark"] .text-primary,[data-bs-theme="dark"] .text-teal,[data-bs-theme="dark"] .text-blue,[data-bs-theme="dark"] .text-sky,[data-bs-theme="dark"] .text-cyan,[data-bs-theme="dark"] .text-info{color:#60a5fa !important}',
      '[data-bs-theme="dark"] .btn-outline-primary,[data-bs-theme="dark"] .btn-outline-teal,[data-bs-theme="dark"] .btn-outline-blue,[data-bs-theme="dark"] .btn-outline-sky,[data-bs-theme="dark"] .btn-outline-cyan,[data-bs-theme="dark"] .btn-outline-info{color:#93c5fd !important;border-color:rgba(59,130,246,0.5) !important}',
      '[data-bs-theme="dark"] .btn-soft-primary,[data-bs-theme="dark"] .btn-soft-teal,[data-bs-theme="dark"] .btn-soft-blue,[data-bs-theme="dark"] .btn-soft-sky,[data-bs-theme="dark"] .btn-soft-cyan,[data-bs-theme="dark"] .btn-soft-info{background:rgba(59,130,246,0.14) !important;color:#93c5fd !important}',
      '[data-bs-theme="dark"] .badge-soft-primary,[data-bs-theme="dark"] .badge-soft-teal,[data-bs-theme="dark"] .badge-soft-blue,[data-bs-theme="dark"] .badge-soft-sky,[data-bs-theme="dark"] .badge-soft-cyan,[data-bs-theme="dark"] .badge-soft-info{background:rgba(59,130,246,0.18) !important;color:#93c5fd !important;border-color:rgba(59,130,246,0.35) !important}',
      '[data-bs-theme="dark"] .link-primary,[data-bs-theme="dark"] .link-teal,[data-bs-theme="dark"] .link-blue,[data-bs-theme="dark"] .link-sky,[data-bs-theme="dark"] .link-cyan,[data-bs-theme="dark"] .link-info{color:#60a5fa !important}',
      '[data-bs-theme="dark"] .alert-primary,[data-bs-theme="dark"] .alert-teal,[data-bs-theme="dark"] .alert-blue,[data-bs-theme="dark"] .alert-sky,[data-bs-theme="dark"] .alert-cyan,[data-bs-theme="dark"] .alert-info{background-color:rgba(59,130,246,0.12) !important;color:#93c5fd !important}',
      '[data-bs-theme="dark"] .hk-menu .navbar-nav .nav-link.active,[data-bs-theme="dark"] .hk-menu .navbar-nav .nav-item.active>.nav-link{color:#ffffff !important}',

      /* DARK mode — hover de TODOS os botões (soft/outline/flush) em todas as cores força texto branco + ícone branco */
      '[data-bs-theme="dark"] .btn-soft-primary:hover,[data-bs-theme="dark"] .btn-soft-teal:hover,[data-bs-theme="dark"] .btn-soft-blue:hover,[data-bs-theme="dark"] .btn-soft-sky:hover,[data-bs-theme="dark"] .btn-soft-cyan:hover,[data-bs-theme="dark"] .btn-soft-info:hover,[data-bs-theme="dark"] .btn-soft-success:hover,[data-bs-theme="dark"] .btn-soft-warning:hover,[data-bs-theme="dark"] .btn-soft-danger:hover,[data-bs-theme="dark"] .btn-soft-secondary:hover,[data-bs-theme="dark"] .btn-soft-dark:hover{color:#ffffff !important}',
      '[data-bs-theme="dark"] .btn-outline-primary:hover,[data-bs-theme="dark"] .btn-outline-teal:hover,[data-bs-theme="dark"] .btn-outline-blue:hover,[data-bs-theme="dark"] .btn-outline-sky:hover,[data-bs-theme="dark"] .btn-outline-cyan:hover,[data-bs-theme="dark"] .btn-outline-info:hover,[data-bs-theme="dark"] .btn-outline-success:hover,[data-bs-theme="dark"] .btn-outline-warning:hover,[data-bs-theme="dark"] .btn-outline-danger:hover,[data-bs-theme="dark"] .btn-outline-secondary:hover,[data-bs-theme="dark"] .btn-outline-dark:hover,[data-bs-theme="dark"] .btn-outline-light:hover{color:#ffffff !important}',
      '[data-bs-theme="dark"] .btn-flush-primary:hover,[data-bs-theme="dark"] .btn-flush-teal:hover,[data-bs-theme="dark"] .btn-flush-blue:hover,[data-bs-theme="dark"] .btn-flush-sky:hover,[data-bs-theme="dark"] .btn-flush-cyan:hover,[data-bs-theme="dark"] .btn-flush-info:hover,[data-bs-theme="dark"] .btn-flush-success:hover,[data-bs-theme="dark"] .btn-flush-warning:hover,[data-bs-theme="dark"] .btn-flush-danger:hover,[data-bs-theme="dark"] .btn-flush-secondary:hover,[data-bs-theme="dark"] .btn-flush-dark:hover{color:#ffffff !important}',
      /* Ícones dentro de botões (SVG com stroke currentColor) acompanham o texto */
      '[data-bs-theme="dark"] .btn:hover svg,[data-bs-theme="dark"] .btn:hover .feather,[data-bs-theme="dark"] .btn:hover [class*="icon"]{color:#ffffff !important;stroke:#ffffff !important}',
      /* Garantir backgrounds de hover com contraste suficiente para o texto branco */
      '[data-bs-theme="dark"] .btn-soft-success:hover{background:rgba(34,197,94,0.30) !important;border-color:rgba(34,197,94,0.55) !important}',
      '[data-bs-theme="dark"] .btn-soft-warning:hover{background:rgba(245,158,11,0.30) !important;border-color:rgba(245,158,11,0.55) !important}',
      '[data-bs-theme="dark"] .btn-soft-danger:hover{background:rgba(239,68,68,0.30) !important;border-color:rgba(239,68,68,0.55) !important}',
      '[data-bs-theme="dark"] .btn-soft-secondary:hover{background:rgba(100,116,139,0.30) !important;border-color:rgba(100,116,139,0.55) !important}',

      /* DARK mode — Tooltip com melhor contraste */
      '[data-bs-theme="dark"] .tooltip-inner{background-color:#1f2937 !important;color:#ffffff !important;border:1px solid rgba(59,130,246,0.3) !important;box-shadow:0 4px 12px rgba(0,0,0,0.5) !important}',
      '[data-bs-theme="dark"] .tooltip .tooltip-arrow::before{border-top-color:#1f2937 !important}',

      /* Global SaaS surfaces — páginas, cards, tabelas, modais e estados */
      '.modal-content{border:1px solid rgba(59,130,246,0.10) !important;border-radius:14px !important;box-shadow:0 24px 60px rgba(15,23,42,0.18) !important;overflow:hidden !important}',
      '.modal-header{background:linear-gradient(180deg,rgba(59,130,246,0.05),transparent) !important;border-bottom-color:rgba(59,130,246,0.10) !important}',
      '.modal-footer{border-top-color:rgba(59,130,246,0.10) !important}',
      '.modal-title{font-weight:700 !important;letter-spacing:-0.01em !important}',
      '.table-responsive,.table-wrap,.dataTables_wrapper{border-color:rgba(59,130,246,0.10) !important}',
      '.table thead th{background:#f8fafc !important;color:#0f172a !important;border-bottom-color:rgba(59,130,246,0.12) !important}',
      '.table tbody tr:hover>*{--bs-table-bg-state:rgba(59,130,246,0.06) !important}',
      '.empty-state,.no-data,.placeholder-state,.upload-zone,.dropzone,.bg-light.border,.rounded.bg-light{border-color:rgba(59,130,246,0.14) !important}',
      '.progress{border:1px solid rgba(59,130,246,0.12) !important}',
      '.progress-bar.bg-primary,.progress-bar:not(.bg-success):not(.bg-danger):not(.bg-warning){background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%) !important}',

      /* Sub-sidebars internas — mesmo DNA visual da sidebar principal */
      '.fmapp-wrap .fmapp-sidebar,.financialapp-wrap .fmapp-sidebar,.documentsapp-wrap .fmapp-sidebar,.monitoringapp-wrap .fmapp-sidebar,.usersapp-wrap .fmapp-sidebar,.adminapp-wrap .fmapp-sidebar{border-right:1px solid rgba(59,130,246,0.10) !important;box-shadow:inset -1px 0 0 rgba(59,130,246,0.04) !important}',
      '.fmapp-wrap .fmapp-sidebar .nav-link,.financialapp-wrap .fmapp-sidebar .nav-link,.documentsapp-wrap .fmapp-sidebar .nav-link,.monitoringapp-wrap .fmapp-sidebar .nav-link,.usersapp-wrap .fmapp-sidebar .nav-link,.adminapp-wrap .fmapp-sidebar .nav-link{border-radius:0 10px 10px 0 !important;transition:transform .15s ease,box-shadow .2s ease,border-color .2s ease,background .2s ease,color .2s ease !important}',
      '.fmapp-wrap .fmapp-sidebar .nav-link,.financialapp-wrap .fmapp-sidebar .nav-link,.documentsapp-wrap .fmapp-sidebar .nav-link,.monitoringapp-wrap .fmapp-sidebar .nav-link,.usersapp-wrap .fmapp-sidebar .nav-link,.adminapp-wrap .fmapp-sidebar .nav-link{display:flex !important;align-items:center !important;min-height:42px !important;gap:.625rem !important}',
      '.fmapp-wrap .fmapp-sidebar .nav-link.btn-link,.financialapp-wrap .fmapp-sidebar .nav-link.btn-link,.documentsapp-wrap .fmapp-sidebar .nav-link.btn-link,.monitoringapp-wrap .fmapp-sidebar .nav-link.btn-link,.usersapp-wrap .fmapp-sidebar .nav-link.btn-link,.adminapp-wrap .fmapp-sidebar .nav-link.btn-link{text-decoration:none !important;white-space:nowrap !important}',
      '.fmapp-wrap .fmapp-sidebar .nav-link .nav-icon-wrap,.financialapp-wrap .fmapp-sidebar .nav-link .nav-icon-wrap,.documentsapp-wrap .fmapp-sidebar .nav-link .nav-icon-wrap,.monitoringapp-wrap .fmapp-sidebar .nav-link .nav-icon-wrap,.usersapp-wrap .fmapp-sidebar .nav-link .nav-icon-wrap,.adminapp-wrap .fmapp-sidebar .nav-link .nav-icon-wrap{flex:0 0 auto !important}',
      '.fmapp-wrap .fmapp-sidebar .nav-link .nav-link-text,.financialapp-wrap .fmapp-sidebar .nav-link .nav-link-text,.documentsapp-wrap .fmapp-sidebar .nav-link .nav-link-text,.monitoringapp-wrap .fmapp-sidebar .nav-link .nav-link-text,.usersapp-wrap .fmapp-sidebar .nav-link .nav-link-text,.adminapp-wrap .fmapp-sidebar .nav-link .nav-link-text{min-width:0 !important;overflow:hidden !important;text-overflow:ellipsis !important;white-space:nowrap !important}',
      '.fmapp-wrap .fmapp-sidebar .nav-link:hover,.financialapp-wrap .fmapp-sidebar .nav-link:hover,.documentsapp-wrap .fmapp-sidebar .nav-link:hover,.monitoringapp-wrap .fmapp-sidebar .nav-link:hover,.usersapp-wrap .fmapp-sidebar .nav-link:hover,.adminapp-wrap .fmapp-sidebar .nav-link:hover{background:linear-gradient(90deg,rgba(59,130,246,0.08),transparent 85%) !important;color:#1e40af !important}',
      '.fmapp-wrap .fmapp-sidebar .nav-item.active>.nav-link,.financialapp-wrap .fmapp-sidebar .nav-item.active>.nav-link,.documentsapp-wrap .fmapp-sidebar .nav-item.active>.nav-link,.monitoringapp-wrap .fmapp-sidebar .nav-item.active>.nav-link,.usersapp-wrap .fmapp-sidebar .nav-item.active>.nav-link,.adminapp-wrap .fmapp-sidebar .nav-item.active>.nav-link{background:linear-gradient(90deg,rgba(59,130,246,0.14),rgba(59,130,246,0.02) 75%,transparent) !important;border-left:3px solid #3b82f6 !important;box-shadow:inset 0 0 0 1px rgba(59,130,246,0.12) !important;color:#1d4ed8 !important;font-weight:600 !important}',

      /* Dark refinements duplicados no script inicial para zero flash */
      '[data-bs-theme="dark"] .modal-content{background:#141d35 !important;border:1px solid rgba(59,130,246,0.18) !important;box-shadow:0 24px 70px rgba(2,6,23,0.72),0 0 0 1px rgba(59,130,246,0.08) !important;color:#c9d1e0 !important}',
      '[data-bs-theme="dark"] .modal-header,[data-bs-theme="dark"] .modal-footer{background:linear-gradient(180deg,rgba(59,130,246,0.08),rgba(20,29,53,0.92)) !important;border-color:rgba(59,130,246,0.14) !important}',
      '[data-bs-theme="dark"] .modal-title{color:#dde3ef !important}',
      '[data-bs-theme="dark"] .modal .btn-close{filter:invert(1) grayscale(100%) brightness(1.35) !important;opacity:.72 !important}',
      '[data-bs-theme="dark"] .card{border:1px solid rgba(59,130,246,0.12) !important;border-radius:14px !important;box-shadow:0 1px 0 rgba(255,255,255,0.02) inset,0 10px 30px rgba(2,6,23,0.55) !important;overflow:hidden !important}',
      '[data-bs-theme="dark"] .card-header{background:linear-gradient(180deg,rgba(59,130,246,0.06),transparent) !important;border-bottom-color:rgba(59,130,246,0.12) !important}',
      '[data-bs-theme="dark"] .card:hover{border-color:rgba(59,130,246,0.28) !important;box-shadow:0 1px 0 rgba(255,255,255,0.03) inset,0 18px 44px rgba(2,6,23,0.6),0 0 0 1px rgba(59,130,246,0.12),0 0 40px -10px rgba(59,130,246,0.35) !important}',
      '[data-bs-theme="dark"] .table thead th{background:#1c2748 !important;color:#dde3ef !important;border-bottom-color:rgba(59,130,246,0.16) !important}',
      '[data-bs-theme="dark"] .table tbody tr,[data-bs-theme="dark"] .table tbody tr>td,[data-bs-theme="dark"] .table tbody tr>th{background-color:transparent !important;box-shadow:none !important}',
      '[data-bs-theme="dark"] .table tbody tr:hover>*{--bs-table-bg-state:transparent !important;background-color:rgba(59,130,246,0.10) !important;box-shadow:inset 0 1px 0 rgba(59,130,246,0.08),inset 0 -1px 0 rgba(59,130,246,0.08) !important;color:#dde3ef !important}',
      '[data-bs-theme="dark"] .text-muted,[data-bs-theme="dark"] small.text-muted,[data-bs-theme="dark"] .form-text{color:#8d97b0 !important}',
      '[data-bs-theme="dark"] .empty-state,[data-bs-theme="dark"] .no-data,[data-bs-theme="dark"] .placeholder-state,[data-bs-theme="dark"] .upload-zone,[data-bs-theme="dark"] .dropzone,[data-bs-theme="dark"] .bg-light.border,[data-bs-theme="dark"] .rounded.bg-light{background:linear-gradient(135deg,rgba(28,39,72,.92),rgba(20,29,53,.92)) !important;border-color:rgba(59,130,246,.22) !important;color:#c9d1e0 !important}',
      '[data-bs-theme="dark"] .fmapp-wrap .fmapp-sidebar,[data-bs-theme="dark"] .financialapp-wrap .fmapp-sidebar,[data-bs-theme="dark"] .documentsapp-wrap .fmapp-sidebar,[data-bs-theme="dark"] .monitoringapp-wrap .fmapp-sidebar,[data-bs-theme="dark"] .usersapp-wrap .fmapp-sidebar,[data-bs-theme="dark"] .adminapp-wrap .fmapp-sidebar{background:#0f172a !important;border-right:1px solid rgba(59,130,246,0.14) !important;box-shadow:inset -1px 0 0 rgba(59,130,246,0.06) !important}',
      '[data-bs-theme="dark"] .fmapp-wrap .fmapp-sidebar .nav-link,[data-bs-theme="dark"] .financialapp-wrap .fmapp-sidebar .nav-link,[data-bs-theme="dark"] .documentsapp-wrap .fmapp-sidebar .nav-link,[data-bs-theme="dark"] .monitoringapp-wrap .fmapp-sidebar .nav-link,[data-bs-theme="dark"] .usersapp-wrap .fmapp-sidebar .nav-link,[data-bs-theme="dark"] .adminapp-wrap .fmapp-sidebar .nav-link{color:#8d97b0 !important}',
      '[data-bs-theme="dark"] .fmapp-wrap .fmapp-sidebar .nav-link:hover,[data-bs-theme="dark"] .financialapp-wrap .fmapp-sidebar .nav-link:hover,[data-bs-theme="dark"] .documentsapp-wrap .fmapp-sidebar .nav-link:hover,[data-bs-theme="dark"] .monitoringapp-wrap .fmapp-sidebar .nav-link:hover,[data-bs-theme="dark"] .usersapp-wrap .fmapp-sidebar .nav-link:hover,[data-bs-theme="dark"] .adminapp-wrap .fmapp-sidebar .nav-link:hover{background:linear-gradient(90deg,rgba(59,130,246,.12),transparent 80%) !important;color:#e9e4ff !important}',
      '[data-bs-theme="dark"] .fmapp-wrap .fmapp-sidebar .nav-item.active>.nav-link,[data-bs-theme="dark"] .financialapp-wrap .fmapp-sidebar .nav-item.active>.nav-link,[data-bs-theme="dark"] .documentsapp-wrap .fmapp-sidebar .nav-item.active>.nav-link,[data-bs-theme="dark"] .monitoringapp-wrap .fmapp-sidebar .nav-item.active>.nav-link,[data-bs-theme="dark"] .usersapp-wrap .fmapp-sidebar .nav-item.active>.nav-link,[data-bs-theme="dark"] .adminapp-wrap .fmapp-sidebar .nav-item.active>.nav-link{background:linear-gradient(90deg,rgba(59,130,246,.22),rgba(59,130,246,.04) 70%,transparent) !important;border-left:3px solid #3b82f6 !important;box-shadow:inset 0 0 0 1px rgba(59,130,246,.18) !important;color:#fff !important}'
    ];

    var style = document.createElement('style');
    style.id = '__landing-identity-overrides__';
    style.textContent = css.join('\\n');
    document.head.appendChild(style);
  } catch(e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${dm_sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: colorModeScript }} />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: landingIdentityScript }} />
      </head>
      <body>
        <GlobalStateProvider>
          <AuthProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </AuthProvider>
        </GlobalStateProvider>
      </body>
    </html>
  )
}
