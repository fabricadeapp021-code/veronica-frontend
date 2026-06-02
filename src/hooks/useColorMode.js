'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';

const COLOR_MODE_KEY = 'voxx.colorMode';
const DARK_STYLE_ID = '__dark-mode-overrides__';

const DARK_CSS = `
/* ══════════════════════════════════════════════
   DARK MODE — GovernAI
   Sobrescreve SCSS compilado com !important
   ══════════════════════════════════════════════ */

/* ── 0. Exceção: tela de login/auth nunca recebe dark mode ── */
/* Usa [data-bs-theme="dark"] .hk-pg-auth para ter especificidade maior que os demais overrides */
[data-bs-theme="dark"] .hk-pg-auth,
[data-bs-theme="dark"] .hk-pg-auth .hk-pg-wrapper,
[data-bs-theme="dark"] .hk-pg-auth .hk-pg-body {
  background-color: #fff !important;
  color: #212529 !important;
  color-scheme: light !important;
}
[data-bs-theme="dark"] .hk-pg-auth .card,
[data-bs-theme="dark"] .hk-pg-auth .card-body { background-color: #fff !important; color: #212529 !important; border-color: #dee2e6 !important; }
[data-bs-theme="dark"] .hk-pg-auth .form-control,
[data-bs-theme="dark"] .hk-pg-auth .input-group-text { background-color: #fff !important; color: #212529 !important; border-color: #dee2e6 !important; }
[data-bs-theme="dark"] .hk-pg-auth .form-label,
[data-bs-theme="dark"] .hk-pg-auth label { color: #212529 !important; }
[data-bs-theme="dark"] .hk-pg-auth h1,
[data-bs-theme="dark"] .hk-pg-auth h2,
[data-bs-theme="dark"] .hk-pg-auth h3,
[data-bs-theme="dark"] .hk-pg-auth h4,
[data-bs-theme="dark"] .hk-pg-auth h5,
[data-bs-theme="dark"] .hk-pg-auth h6 { color: #212529 !important; }
[data-bs-theme="dark"] .hk-pg-auth p,
[data-bs-theme="dark"] .hk-pg-auth span:not(.badge):not(.btn) { color: #212529 !important; }
[data-bs-theme="dark"] .hk-pg-auth .text-muted { color: #6c757d !important; }
[data-bs-theme="dark"] .hk-pg-auth a:not(.btn) { color: #0d6efd !important; }
[data-bs-theme="dark"] .hk-pg-auth .hk-auth-content,
[data-bs-theme="dark"] .hk-pg-auth .hk-auth-content-img,
[data-bs-theme="dark"] .hk-pg-auth .auth-content,
[data-bs-theme="dark"] .hk-pg-auth .auth-split { background-color: #fff !important; }
[data-bs-theme="dark"] .hk-pg-auth .simplebar-content-wrapper,
[data-bs-theme="dark"] .hk-pg-auth .nicescroll-bar { background-color: #fff !important; }

/* ── 1. CSS Variables Bootstrap ── */
[data-bs-theme="dark"] {
  --bs-body-bg: #0f172a !important;
  --bs-body-bg-rgb: 15,23,42 !important;
  --bs-body-color: #c9d1e0 !important;
  --bs-body-color-rgb: 201,209,224 !important;
  --bs-border-color: #2a2f3d !important;
  --bs-border-color-translucent: rgba(255,255,255,0.08) !important;
  --bs-secondary-bg: #141d35 !important;
  --bs-secondary-bg-rgb: 20,29,53 !important;
  --bs-tertiary-bg: #191c27 !important;
  --bs-tertiary-bg-rgb: 25,28,39 !important;
  --bs-emphasis-color: #f0f3f8 !important;
  --bs-heading-color: #dde3ef !important;
  --bs-secondary-color: rgba(201,209,224,0.65) !important;
  --bs-tertiary-color: rgba(201,209,224,0.40) !important;
  --bs-link-color: #60a5fa !important;
  --bs-link-hover-color: #93c5fd !important;
  --bs-link-color-rgb: 96,165,250 !important;
  --bs-primary: #3b82f6 !important;
  --bs-primary-rgb: 59,130,246 !important;
  --bs-teal: #3b82f6 !important;
  --bs-teal-rgb: 59,130,246 !important;
  color-scheme: dark;
}

/* ── 2. Fundo da página ── */
[data-bs-theme="dark"] body,
[data-bs-theme="dark"] .hk-pg-wrapper,
[data-bs-theme="dark"] .hk-pg-body {
  background-color: #0f172a !important;
  color: #c9d1e0 !important;
}

/* ── 2b. Herança de cor — garante que todo texto dentro do card seja claro ── */
[data-bs-theme="dark"] .card,
[data-bs-theme="dark"] .card .card-body,
[data-bs-theme="dark"] .card .card-body *:not(.badge):not(.btn):not([class*="text-"]):not([class*="bg-"]) {
  color: #c9d1e0 !important;
}
[data-bs-theme="dark"] .card .card-title,
[data-bs-theme="dark"] .card h1,
[data-bs-theme="dark"] .card h2,
[data-bs-theme="dark"] .card h3,
[data-bs-theme="dark"] .card h4,
[data-bs-theme="dark"] .card h5,
[data-bs-theme="dark"] .card h6,
[data-bs-theme="dark"] .card .h1,
[data-bs-theme="dark"] .card .h2,
[data-bs-theme="dark"] .card .h3,
[data-bs-theme="dark"] .card .h4,
[data-bs-theme="dark"] .card .h5,
[data-bs-theme="dark"] .card .h6 {
  color: #dde3ef !important;
}
[data-bs-theme="dark"] .card .text-muted,
[data-bs-theme="dark"] .card small.text-muted {
  color: #5a6480 !important;
}
[data-bs-theme="dark"] .card .fw-medium,
[data-bs-theme="dark"] .card .fw-bold,
[data-bs-theme="dark"] .card .fw-semibold {
  color: #dde3ef !important;
}

/* ── 3. Page Header ── */
[data-bs-theme="dark"] .hk-pg-header {
  background: #1a1d27 !important;
  border-bottom-color: #2a2f3d !important;
}
[data-bs-theme="dark"] .hk-pg-header .pg-title,
[data-bs-theme="dark"] .hk-pg-header h1,
[data-bs-theme="dark"] .hk-pg-header h2,
[data-bs-theme="dark"] .hk-pg-header h3 {
  color: #dde3ef !important;
}

/* ── 4. TopNav / Navbar ── */
[data-bs-theme="dark"] .hk-navbar {
  background-color: #0f172a !important;
  border-bottom: 1px solid transparent !important;
  box-shadow:
    0 1px 0 0 rgba(59,130,246,0.16),
    0 4px 18px rgba(0,0,0,0.45) !important;
  background-image: linear-gradient(180deg, rgba(59,130,246,0.04), transparent 60%) !important;
}
[data-bs-theme="dark"] .fm-body {
  background-color: #0f172a !important;
}
[data-bs-theme="dark"] .hk-navbar .btn-flush-dark,
[data-bs-theme="dark"] .hk-navbar .navbar-toggle {
  color: #c9d1e0 !important;
}
[data-bs-theme="dark"] .hk-navbar .btn-flush-dark:hover {
  background-color: #1c2748 !important;
}

/* ── 5. Sidebar / Menu ── */
[data-bs-theme="dark"] .hk-menu {
  background-color: #0f172a !important;
  border-right: 1px solid #1e293b !important;
}
[data-bs-theme="dark"] .hk-menu .navbar-brand,
[data-bs-theme="dark"] .hk-menu .brand-img {
  filter: brightness(0.9) !important;
}
[data-bs-theme="dark"] .hk-menu .nav-header {
  color: #64748b !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
  font-size: 0.7rem !important;
}
[data-bs-theme="dark"] .hk-menu .navbar-nav .nav-link {
  color: #94a3b8 !important;
  gap: 0.5rem !important;
  transition: all 0.15s ease !important;
}
[data-bs-theme="dark"] .hk-menu .navbar-nav .nav-link:hover,
[data-bs-theme="dark"] .hk-menu .navbar-nav .nav-item:hover > .nav-link {
  color: #e2e8f0 !important;
  background-color: #1e293b !important;
}
[data-bs-theme="dark"] .hk-menu .navbar-nav .nav-item.active > .nav-link,
[data-bs-theme="dark"] .hk-menu .navbar-nav .nav-link.active {
  color: #fff !important;
  background-color: #1e293b !important;
  border-radius: 0.5rem !important;
  border-left: 3px solid #3b82f6 !important;
}
[data-bs-theme="dark"] .hk-menu .navbar-nav .nav-item.active > .nav-link > *,
[data-bs-theme="dark"] .hk-menu .navbar-nav .nav-link.active > * {
  color: #fff !important;
}
[data-bs-theme="dark"] .hk-menu .navbar-nav .nav-item.active > .nav-link .svg-icon svg,
[data-bs-theme="dark"] .hk-menu .navbar-nav .nav-link.active .svg-icon svg {
  stroke: #fff !important;
}
[data-bs-theme="dark"] .hk-menu .svg-icon svg {
  stroke: currentColor !important;
}
[data-bs-theme="dark"] .hk-menu .simplebar-scrollbar::before {
  background-color: #334155 !important;
}
[data-bs-theme="dark"] .hk-menu .nicescroll-bar {
  background-color: #0f172a !important;
}

/* ── 6. Cards ── */
[data-bs-theme="dark"] .card {
  background-color: #141d35 !important;
  border-color: #2a2f3d !important;
  color: #c9d1e0 !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.35) !important;
}
[data-bs-theme="dark"] .card-header {
  background-color: #1c2748 !important;
  border-bottom-color: #2a2f3d !important;
  color: #dde3ef !important;
}
[data-bs-theme="dark"] .card-footer {
  background-color: #1c2748 !important;
  border-top-color: #2a2f3d !important;
}
[data-bs-theme="dark"] .card-title,
[data-bs-theme="dark"] .card-header h1,
[data-bs-theme="dark"] .card-header h2,
[data-bs-theme="dark"] .card-header h3,
[data-bs-theme="dark"] .card-header h4,
[data-bs-theme="dark"] .card-header h5,
[data-bs-theme="dark"] .card-header h6 {
  color: #dde3ef !important;
}
[data-bs-theme="dark"] .shadow-sm {
  box-shadow: 0 2px 8px rgba(0,0,0,0.4) !important;
}

/* ── 7. Tabelas ── */
[data-bs-theme="dark"] .table {
  --bs-table-bg: #141d35;
  --bs-table-striped-bg: #232739;
  --bs-table-hover-bg: #262b3c;
  --bs-table-border-color: #2a2f3d;
  color: #c9d1e0 !important;
  border-color: #2a2f3d !important;
}
[data-bs-theme="dark"] .table th {
  color: #8d97b0 !important;
  border-color: #2a2f3d !important;
}
[data-bs-theme="dark"] .table td {
  border-color: #2a2f3d !important;
}

/* ── 8. Formulários ── */
[data-bs-theme="dark"] .form-control,
[data-bs-theme="dark"] .form-select,
[data-bs-theme="dark"] textarea.form-control {
  background-color: #1c2748 !important;
  border-color: #2a2f3d !important;
  color: #c9d1e0 !important;
}
[data-bs-theme="dark"] .form-control::placeholder,
[data-bs-theme="dark"] .form-select::placeholder {
  color: #4a5268 !important;
}
[data-bs-theme="dark"] .form-control:focus,
[data-bs-theme="dark"] .form-select:focus {
  background-color: #2d3348 !important;
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 0.2rem rgba(59,130,246,0.22) !important;
}
[data-bs-theme="dark"] .input-group-text {
  background-color: #1c2748 !important;
  border-color: #2a2f3d !important;
  color: #8d97b0 !important;
}
[data-bs-theme="dark"] .form-label {
  color: #9aa3bc !important;
}
[data-bs-theme="dark"] .form-text {
  color: #5a6480 !important;
}

/* ── 9. Dropdowns ── */
[data-bs-theme="dark"] .dropdown-menu {
  background-color: #141d35 !important;
  border-color: #2a2f3d !important;
  box-shadow: 0 4px 16px rgba(0,0,0,0.5) !important;
}
[data-bs-theme="dark"] .dropdown-item {
  color: #c9d1e0 !important;
}
[data-bs-theme="dark"] .dropdown-item:hover,
[data-bs-theme="dark"] .dropdown-item:focus {
  background-color: #1c2748 !important;
  color: #fff !important;
}
[data-bs-theme="dark"] .dropdown-divider {
  border-color: #2a2f3d !important;
}
[data-bs-theme="dark"] .dropdown-header {
  color: #5a6480 !important;
}

/* ── 10. Modais ── */
[data-bs-theme="dark"] .modal-content {
  background-color: #141d35 !important;
  border-color: #2a2f3d !important;
  color: #c9d1e0 !important;
}
[data-bs-theme="dark"] .modal-header {
  background-color: #1c2748 !important;
  border-bottom-color: #2a2f3d !important;
}
[data-bs-theme="dark"] .modal-footer {
  background-color: #1c2748 !important;
  border-top-color: #2a2f3d !important;
}
[data-bs-theme="dark"] .modal-backdrop {
  background-color: #000 !important;
}

/* ── 11. List Groups ── */
[data-bs-theme="dark"] .list-group-item {
  background-color: #141d35 !important;
  border-color: #2a2f3d !important;
  color: #c9d1e0 !important;
}
[data-bs-theme="dark"] .list-group-item:hover {
  background-color: #1c2748 !important;
}
[data-bs-theme="dark"] .list-group-item-action {
  color: #c9d1e0 !important;
}

/* ── 12. Alertas ── */
[data-bs-theme="dark"] .alert {
  border-color: #2a2f3d !important;
}
[data-bs-theme="dark"] .alert-info {
  background-color: #1a2a3a !important;
  color: #7eb8ff !important;
}
[data-bs-theme="dark"] .alert-warning {
  background-color: #2a2410 !important;
  color: #ffc868 !important;
}
[data-bs-theme="dark"] .alert-danger {
  background-color: #2a1515 !important;
  color: #ff7b7b !important;
}
[data-bs-theme="dark"] .alert-success {
  background-color: #122a1a !important;
  color: #6bdb9a !important;
}

/* ── 13. Badges ── */
[data-bs-theme="dark"] .hk-menu .badge {
  border: 1px solid transparent !important;
}
[data-bs-theme="dark"] .hk-menu .badge-soft-success,
[data-bs-theme="dark"] .hk-menu .bg-success-light-5.badge {
  background-color: rgba(25,135,84,0.22) !important;
  color: #7ee2a8 !important;
  border-color: rgba(25,135,84,0.35) !important;
}
[data-bs-theme="dark"] .hk-menu .badge-soft-danger,
[data-bs-theme="dark"] .hk-menu .bg-danger-light-5.badge {
  background-color: rgba(220,53,69,0.22) !important;
  color: #ff9aa5 !important;
  border-color: rgba(220,53,69,0.35) !important;
}
[data-bs-theme="dark"] .hk-menu .badge-soft-warning,
[data-bs-theme="dark"] .hk-menu .bg-warning-light-5.badge {
  background-color: rgba(255,193,7,0.18) !important;
  color: #ffd86b !important;
  border-color: rgba(255,193,7,0.3) !important;
}
[data-bs-theme="dark"] .hk-menu .badge-outline.badge-success {
  color: #00D67F !important;
  border-color: #00D67F !important;
  background: transparent !important;
}
[data-bs-theme="dark"] .hk-menu .badge-outline.badge-danger {
  color: #ff4d4d !important;
  border-color: #ff4d4d !important;
  background: transparent !important;
}
[data-bs-theme="dark"] .hk-menu .badge-outline.badge-warning {
  color: #FFC400 !important;
  border-color: #FFC400 !important;
  background: transparent !important;
}
[data-bs-theme="dark"] .hk-menu .navbar-nav .nav-link .badge {
  font-weight: 600 !important;
}
[data-bs-theme="dark"] .badge.bg-light {
  background-color: #1c2748 !important;
  color: #c9d1e0 !important;
}
[data-bs-theme="dark"] .bg-secondary-light-5 {
  background-color: #1c2748 !important;
}

/* ── 14. Breadcrumb ── */
[data-bs-theme="dark"] .breadcrumb-item,
[data-bs-theme="dark"] .breadcrumb-item a {
  color: #8d97b0 !important;
}
[data-bs-theme="dark"] .breadcrumb-item.active {
  color: #c9d1e0 !important;
}
[data-bs-theme="dark"] .breadcrumb-item + .breadcrumb-item::before {
  color: #4a5268 !important;
}

/* ── 15. Tabs / Nav Pills ── */
[data-bs-theme="dark"] .nav-tabs {
  border-bottom-color: #2a2f3d !important;
}
[data-bs-theme="dark"] .nav-tabs .nav-link {
  color: #8d97b0 !important;
}
[data-bs-theme="dark"] .nav-tabs .nav-link:hover {
  border-color: #2a2f3d !important;
  color: #c9d1e0 !important;
}
[data-bs-theme="dark"] .nav-tabs .nav-link.active {
  background-color: #141d35 !important;
  border-color: #2a2f3d #2a2f3d #141d35 !important;
  color: #dde3ef !important;
}

/* ── 16. Buttons outline/ghost ── */
[data-bs-theme="dark"] .btn-outline-light {
  border-color: #2a2f3d !important;
  color: #c9d1e0 !important;
}
[data-bs-theme="dark"] .btn-outline-light:hover {
  background-color: #1c2748 !important;
  color: #fff !important;
}
[data-bs-theme="dark"] .btn-white {
  background-color: #1c2748 !important;
  border-color: #2a2f3d !important;
  color: #c9d1e0 !important;
}
[data-bs-theme="dark"] .btn-flush-dark {
  color: #c9d1e0 !important;
}
[data-bs-theme="dark"] .btn-flush-dark:hover {
  background-color: #1c2748 !important;
}

/* ── 17. Textos e utilitários ── */
[data-bs-theme="dark"] h1,
[data-bs-theme="dark"] h2,
[data-bs-theme="dark"] h3,
[data-bs-theme="dark"] h4,
[data-bs-theme="dark"] h5,
[data-bs-theme="dark"] h6 {
  color: #dde3ef !important;
}
[data-bs-theme="dark"] p {
  color: #c9d1e0 !important;
}
[data-bs-theme="dark"] .text-dark { color: #c9d1e0 !important; }
[data-bs-theme="dark"] .text-muted { color: #5a6480 !important; }
[data-bs-theme="dark"] .text-secondary { color: #7a84a0 !important; }
[data-bs-theme="dark"] .bg-light { background-color: #1c2748 !important; }
[data-bs-theme="dark"] .bg-white { background-color: #141d35 !important; }
[data-bs-theme="dark"] .bg-body { background-color: #0f172a !important; }
[data-bs-theme="dark"] .border { border-color: #2a2f3d !important; }
[data-bs-theme="dark"] .border-bottom { border-bottom-color: #2a2f3d !important; }
[data-bs-theme="dark"] .border-top { border-top-color: #2a2f3d !important; }
[data-bs-theme="dark"] .border-start { border-left-color: #2a2f3d !important; }
[data-bs-theme="dark"] .border-end { border-right-color: #2a2f3d !important; }
[data-bs-theme="dark"] .text-body { color: #c9d1e0 !important; }

/* ── 18. SimpleBar scrollbar ── */
[data-bs-theme="dark"] .simplebar-scrollbar::before {
  background-color: #3a4054 !important;
}

/* ── 19. Footer ── */
[data-bs-theme="dark"] .hk-footer,
[data-bs-theme="dark"] footer {
  background-color: #1a1d27 !important;
  border-top-color: #2a2f3d !important;
  color: #5a6480 !important;
}
[data-bs-theme="dark"] .footer-text,
[data-bs-theme="dark"] .footer-text a {
  color: #5a6480 !important;
}

/* ── 20. Separadores / dividers ── */
[data-bs-theme="dark"] hr {
  border-color: #2a2f3d !important;
  opacity: 1 !important;
}

/* ── 21. App layouts (fmapp, chatapp, emailapp, calendarapp, todoapp, invoiceapp) ── */
/* Sidebars de apps */
[data-bs-theme="dark"] .fmapp-wrap .fmapp-sidebar,
[data-bs-theme="dark"] .chatapp-wrap .chatapp-aside,
[data-bs-theme="dark"] .chatapp-wrap .chatapp-aside header.aside-header,
[data-bs-theme="dark"] .emailapp-wrap .emailapp-sidebar,
[data-bs-theme="dark"] .calendarapp-wrap .calendarapp-sidebar,
[data-bs-theme="dark"] .todoapp-wrap .todoapp-sidebar,
[data-bs-theme="dark"] .invoiceapp-wrap .invoiceapp-sidebar {
  background: #1a1d27 !important;
  border-right-color: #2a2f3d !important;
  border-bottom-color: #2a2f3d !important;
  color: #c9d1e0 !important;
}
/* Content areas */
[data-bs-theme="dark"] .fmapp-wrap .fmapp-content,
[data-bs-theme="dark"] .chatapp-wrap .chatapp-single-chat,
[data-bs-theme="dark"] .chatapp-wrap .chatapp-single-chat header.chat-header,
[data-bs-theme="dark"] .emailapp-wrap .emailapp-content,
[data-bs-theme="dark"] .calendarapp-wrap .calendarapp-content,
[data-bs-theme="dark"] .todoapp-wrap .todoapp-content,
[data-bs-theme="dark"] .invoiceapp-wrap .invoiceapp-content {
  background: #0f172a !important;
  border-color: #2a2f3d !important;
  color: #c9d1e0 !important;
}
/* Detail wrap + header (fmapp-detail-wrap, emailapp-detail-wrap, etc.) */
[data-bs-theme="dark"] .fmapp-detail-wrap,
[data-bs-theme="dark"] .fmapp-wrap .fmapp-detail-wrap,
[data-bs-theme="dark"] .fmapp-wrap .fmapp-content .fmapp-detail-wrap,
[data-bs-theme="dark"] .fmapp-wrap .fmapp-detail-wrap header.fm-header,
[data-bs-theme="dark"] .fmapp-wrap .fmapp-detail-wrap .fm-header,
[data-bs-theme="dark"] .fmapp-wrap .fmapp-content .fmapp-detail-wrap header.fm-header,
[data-bs-theme="dark"] .fmapp-wrap .fmapp-content .fmapp-detail-wrap .fm-header,
[data-bs-theme="dark"] .emailapp-wrap .emailapp-detail-wrap,
[data-bs-theme="dark"] .emailapp-wrap .emailapp-content .emailapp-detail-wrap,
[data-bs-theme="dark"] .invoiceapp-wrap .invoiceapp-detail-wrap,
[data-bs-theme="dark"] .invoiceapp-wrap .invoiceapp-content .invoiceapp-detail-wrap {
  background: #0f172a !important;
  border-bottom-color: #2a2f3d !important;
  border-left-color: #2a2f3d !important;
  color: #c9d1e0 !important;
}
[data-bs-theme="dark"] .fmapp-wrap .fmapp-detail-wrap h1,
[data-bs-theme="dark"] .fmapp-wrap .fmapp-detail-wrap h2,
[data-bs-theme="dark"] .fmapp-wrap .fmapp-detail-wrap h3,
[data-bs-theme="dark"] .fmapp-wrap .fmapp-detail-wrap h4,
[data-bs-theme="dark"] .fmapp-wrap .fmapp-detail-wrap h5,
[data-bs-theme="dark"] .fmapp-wrap .fmapp-detail-wrap h6,
[data-bs-theme="dark"] .fmapp-wrap .fmapp-content .fmapp-detail-wrap h1,
[data-bs-theme="dark"] .fmapp-wrap .fmapp-content .fmapp-detail-wrap h2,
[data-bs-theme="dark"] .fmapp-wrap .fmapp-content .fmapp-detail-wrap h3,
[data-bs-theme="dark"] .fmapp-wrap .fmapp-content .fmapp-detail-wrap h4,
[data-bs-theme="dark"] .fmapp-wrap .fmapp-content .fmapp-detail-wrap h5,
[data-bs-theme="dark"] .fmapp-wrap .fmapp-content .fmapp-detail-wrap h6 {
  color: #dde3ef !important;
}

/* Garantia extra — qualquer elemento filho direto do fmapp-detail-wrap herda cor clara */
[data-bs-theme="dark"] .fmapp-detail-wrap,
[data-bs-theme="dark"] .fmapp-detail-wrap * {
  background-color: transparent;
}
[data-bs-theme="dark"] .fmapp-detail-wrap {
  background-color: #0f172a !important;
}
[data-bs-theme="dark"] .fmapp-wrap .fmapp-content .fmapp-detail-wrap header.fm-header,
[data-bs-theme="dark"] .fmapp-wrap .fmapp-detail-wrap header.fm-header,
[data-bs-theme="dark"] .fmapp-wrap header.fm-header {
  background: linear-gradient(180deg, #141d35 0%, #111a30 100%) !important;
  border-bottom: 1px solid rgba(59,130,246,0.16) !important;
  box-shadow: 0 1px 0 rgba(255,255,255,0.02) inset, 0 10px 30px rgba(2,6,23,0.30) !important;
  color: #dde3ef !important;
}
[data-bs-theme="dark"] .fmapp-wrap header.fm-header *,
[data-bs-theme="dark"] .fmapp-wrap header.fm-header .fmapp-title,
[data-bs-theme="dark"] .fmapp-wrap header.fm-header .fm-options-wrap {
  background-color: transparent !important;
}
[data-bs-theme="dark"] .fmapp-wrap header.fm-header h1,
[data-bs-theme="dark"] .fmapp-wrap header.fm-header h2,
[data-bs-theme="dark"] .fmapp-wrap header.fm-header h3,
[data-bs-theme="dark"] .fmapp-wrap header.fm-header h4,
[data-bs-theme="dark"] .fmapp-wrap header.fm-header h5,
[data-bs-theme="dark"] .fmapp-wrap header.fm-header h6 {
  color: #dde3ef !important;
}
/* Nav links inside app sidebars */
[data-bs-theme="dark"] .fmapp-wrap .navbar-nav .nav-link,
[data-bs-theme="dark"] .emailapp-wrap .navbar-nav .nav-link,
[data-bs-theme="dark"] .calendarapp-wrap .navbar-nav .nav-link,
[data-bs-theme="dark"] .todoapp-wrap .navbar-nav .nav-link,
[data-bs-theme="dark"] .invoiceapp-wrap .navbar-nav .nav-link {
  color: #8d97b0 !important;
}
[data-bs-theme="dark"] .fmapp-wrap .navbar-nav .nav-link:hover,
[data-bs-theme="dark"] .emailapp-wrap .navbar-nav .nav-link:hover,
[data-bs-theme="dark"] .todoapp-wrap .navbar-nav .nav-link:hover {
  color: #dde3ef !important;
  background-color: #1c2748 !important;
}
[data-bs-theme="dark"] .fmapp-wrap .navbar-nav .nav-item.active > .nav-link,
[data-bs-theme="dark"] .emailapp-wrap .navbar-nav .nav-item.active > .nav-link,
[data-bs-theme="dark"] .calendarapp-wrap .navbar-nav .nav-item.active > .nav-link,
[data-bs-theme="dark"] .todoapp-wrap .navbar-nav .nav-item.active > .nav-link,
[data-bs-theme="dark"] .invoiceapp-wrap .navbar-nav .nav-item.active > .nav-link {
  color: #fff !important;
  background-color: #3b82f6 !important;
}
/* Section headers / footer bars inside app panels */
[data-bs-theme="dark"] .fmapp-wrap .fmapp-storage,
[data-bs-theme="dark"] .fmapp-wrap .fmapp-fixednav,
[data-bs-theme="dark"] .todoapp-wrap .todoapp-fixednav,
[data-bs-theme="dark"] .invoiceapp-wrap .invoiceapp-fixednav {
  background: #141d35 !important;
  border-top-color: #2a2f3d !important;
  border-bottom-color: #2a2f3d !important;
}
/* Chat message area */
[data-bs-theme="dark"] .chatapp-wrap .chat-body {
  background: #13151a !important;
}
[data-bs-theme="dark"] .chatapp-wrap .chat-footer {
  background: #1a1d27 !important;
  border-top-color: #2a2f3d !important;
}
/* Contact list items */
[data-bs-theme="dark"] .chatapp-wrap .list-group-item,
[data-bs-theme="dark"] .fmapp-wrap .list-group-item {
  background: transparent !important;
  border-color: #2a2f3d !important;
}
/* Menu title / labels */
[data-bs-theme="dark"] .fmapp-wrap .menu-title,
[data-bs-theme="dark"] .emailapp-wrap .menu-title,
[data-bs-theme="dark"] .todoapp-wrap .menu-title {
  color: #5a6480 !important;
}
/* Separators inside sidebars */
[data-bs-theme="dark"] .fmapp-wrap .separator,
[data-bs-theme="dark"] .emailapp-wrap .separator,
[data-bs-theme="dark"] .calendarapp-wrap .separator {
  border-color: #2a2f3d !important;
}

/* ────────────────────────────────────────────────────────────
   BLUE → VIOLET (Landing Identity Takeover)
   Substitui toda a paleta azul/ciano/info/sky do sistema pela
   paleta violeta da landing. Cobre CSS vars, utilitários,
   botões, badges, links, focus, charts stroke/fill e estados
   hover. Mantém cores semânticas (success/danger/warning).
   ──────────────────────────────────────────────────────────── */

/* 1. Variáveis Bootstrap (blue / info / primary já foi acima) */
[data-bs-theme="dark"] {
  --bs-blue: #3b82f6 !important;
  --bs-blue-rgb: 59,130,246 !important;
  --bs-indigo: #2563eb !important;
  --bs-indigo-rgb: 37,99,235 !important;
  --bs-info: #3b82f6 !important;
  --bs-info-rgb: 59,130,246 !important;
  --bs-info-text-emphasis: #93c5fd !important;
  --bs-info-bg-subtle: rgba(59,130,246,0.12) !important;
  --bs-info-border-subtle: rgba(59,130,246,0.35) !important;
}

/* 2. Backgrounds azul/ciano/sky/info */
[data-bs-theme="dark"] .bg-blue,
[data-bs-theme="dark"] .bg-sky,
[data-bs-theme="dark"] .bg-cyan,
[data-bs-theme="dark"] .bg-info {
  background-color: #3b82f6 !important;
  color: #fff !important;
}
[data-bs-theme="dark"] .bg-blue-light-5,
[data-bs-theme="dark"] .bg-sky-light-5,
[data-bs-theme="dark"] .bg-cyan-light-5,
[data-bs-theme="dark"] .bg-info-light-5 {
  background-color: rgba(59,130,246,0.12) !important;
  color: #93c5fd !important;
}
[data-bs-theme="dark"] .bg-blue-light-4,
[data-bs-theme="dark"] .bg-sky-light-4,
[data-bs-theme="dark"] .bg-cyan-light-4,
[data-bs-theme="dark"] .bg-info-light-4 {
  background-color: rgba(59,130,246,0.2) !important;
  color: #93c5fd !important;
}

/* 3. Texto azul/ciano/sky/info */
[data-bs-theme="dark"] .text-blue,
[data-bs-theme="dark"] .text-sky,
[data-bs-theme="dark"] .text-cyan,
[data-bs-theme="dark"] .text-info {
  color: #60a5fa !important;
}

/* 4. Bordas */
[data-bs-theme="dark"] .border-blue,
[data-bs-theme="dark"] .border-sky,
[data-bs-theme="dark"] .border-cyan,
[data-bs-theme="dark"] .border-info {
  border-color: #3b82f6 !important;
}

/* 5. Botões — sólido, outline e soft */
[data-bs-theme="dark"] .btn-blue,
[data-bs-theme="dark"] .btn-sky,
[data-bs-theme="dark"] .btn-cyan,
[data-bs-theme="dark"] .btn-info {
  background: linear-gradient(135deg,#3b82f6 0%,#2563eb 100%) !important;
  border-color: transparent !important;
  color: #fff !important;
  box-shadow: 0 6px 18px -6px rgba(59,130,246,0.6) !important;
}
[data-bs-theme="dark"] .btn-blue:hover,
[data-bs-theme="dark"] .btn-sky:hover,
[data-bs-theme="dark"] .btn-cyan:hover,
[data-bs-theme="dark"] .btn-info:hover,
[data-bs-theme="dark"] .btn-blue:focus,
[data-bs-theme="dark"] .btn-sky:focus,
[data-bs-theme="dark"] .btn-cyan:focus,
[data-bs-theme="dark"] .btn-info:focus {
  background: linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%) !important;
  color: #fff !important;
}
[data-bs-theme="dark"] .btn-outline-blue,
[data-bs-theme="dark"] .btn-outline-sky,
[data-bs-theme="dark"] .btn-outline-cyan,
[data-bs-theme="dark"] .btn-outline-info {
  color: #93c5fd !important;
  border-color: rgba(59,130,246,0.5) !important;
  background: transparent !important;
}
[data-bs-theme="dark"] .btn-outline-blue:hover,
[data-bs-theme="dark"] .btn-outline-sky:hover,
[data-bs-theme="dark"] .btn-outline-cyan:hover,
[data-bs-theme="dark"] .btn-outline-info:hover {
  background: linear-gradient(135deg,rgba(59,130,246,0.18),rgba(59,130,246,0.06)) !important;
  border-color: #3b82f6 !important;
  color: #fff !important;
}
[data-bs-theme="dark"] .btn-soft-blue,
[data-bs-theme="dark"] .btn-soft-sky,
[data-bs-theme="dark"] .btn-soft-cyan,
[data-bs-theme="dark"] .btn-soft-info {
  background: rgba(59,130,246,0.14) !important;
  color: #93c5fd !important;
  border-color: transparent !important;
}
[data-bs-theme="dark"] .btn-flush-blue,
[data-bs-theme="dark"] .btn-flush-sky,
[data-bs-theme="dark"] .btn-flush-cyan,
[data-bs-theme="dark"] .btn-flush-info {
  color: #60a5fa !important;
}

/* 6. Badges */
[data-bs-theme="dark"] .badge.bg-blue,
[data-bs-theme="dark"] .badge.bg-sky,
[data-bs-theme="dark"] .badge.bg-cyan,
[data-bs-theme="dark"] .badge.bg-info,
[data-bs-theme="dark"] .badge-blue,
[data-bs-theme="dark"] .badge-sky,
[data-bs-theme="dark"] .badge-cyan,
[data-bs-theme="dark"] .badge-info {
  background: linear-gradient(135deg,#3b82f6,#2563eb) !important;
  color: #fff !important;
}
[data-bs-theme="dark"] .badge-soft-blue,
[data-bs-theme="dark"] .badge-soft-sky,
[data-bs-theme="dark"] .badge-soft-cyan,
[data-bs-theme="dark"] .badge-soft-info {
  background: rgba(59,130,246,0.18) !important;
  color: #93c5fd !important;
  border-color: rgba(59,130,246,0.35) !important;
}
[data-bs-theme="dark"] .badge-outline.badge-blue,
[data-bs-theme="dark"] .badge-outline.badge-sky,
[data-bs-theme="dark"] .badge-outline.badge-cyan,
[data-bs-theme="dark"] .badge-outline.badge-info {
  color: #60a5fa !important;
  border-color: #3b82f6 !important;
  background: transparent !important;
}

/* 7. Links azuis hardcoded (#7eb8ff → violeta) */
[data-bs-theme="dark"] a:not(.btn):not(.nav-link):not(.dropdown-item) {
  color: #60a5fa !important;
}
[data-bs-theme="dark"] a:not(.btn):not(.nav-link):not(.dropdown-item):hover {
  color: #93c5fd !important;
}

/* 8. Alerts info */
[data-bs-theme="dark"] .alert-info,
[data-bs-theme="dark"] .alert-blue,
[data-bs-theme="dark"] .alert-sky,
[data-bs-theme="dark"] .alert-cyan {
  background-color: rgba(59,130,246,0.12) !important;
  border-color: rgba(59,130,246,0.35) !important;
  color: #93c5fd !important;
}

/* 9. SVG strokes/fills azuis conhecidos — reprintados em violeta */
[data-bs-theme="dark"] svg [stroke="#298DFF"],
[data-bs-theme="dark"] svg [stroke="#00B0FF"],
[data-bs-theme="dark"] svg [stroke="#18DDEF"],
[data-bs-theme="dark"] svg[stroke="#298DFF"],
[data-bs-theme="dark"] svg[stroke="#00B0FF"],
[data-bs-theme="dark"] svg[stroke="#18DDEF"] {
  stroke: #3b82f6 !important;
}
[data-bs-theme="dark"] svg [fill="#298DFF"],
[data-bs-theme="dark"] svg [fill="#00B0FF"],
[data-bs-theme="dark"] svg [fill="#18DDEF"],
[data-bs-theme="dark"] svg[fill="#298DFF"],
[data-bs-theme="dark"] svg[fill="#00B0FF"],
[data-bs-theme="dark"] svg[fill="#18DDEF"] {
  fill: #3b82f6 !important;
}

/* 10. Progress / range / spinners azuis */
[data-bs-theme="dark"] .progress-bar.bg-blue,
[data-bs-theme="dark"] .progress-bar.bg-sky,
[data-bs-theme="dark"] .progress-bar.bg-cyan,
[data-bs-theme="dark"] .progress-bar.bg-info {
  background-color: #3b82f6 !important;
}
[data-bs-theme="dark"] .spinner-border.text-blue,
[data-bs-theme="dark"] .spinner-border.text-sky,
[data-bs-theme="dark"] .spinner-border.text-cyan,
[data-bs-theme="dark"] .spinner-border.text-info {
  color: #60a5fa !important;
}

[data-bs-theme="dark"] .modal-content {
  background: #141d35 !important;
  border: 1px solid rgba(59,130,246,0.18) !important;
  border-radius: 14px !important;
  box-shadow: 0 24px 70px rgba(2,6,23,0.72), 0 0 0 1px rgba(59,130,246,0.08) !important;
  overflow: hidden;
}
[data-bs-theme="dark"] .modal-header,
[data-bs-theme="dark"] .modal-footer {
  background: linear-gradient(180deg, rgba(59,130,246,0.08), rgba(20,29,53,0.92)) !important;
  border-color: rgba(59,130,246,0.14) !important;
}
[data-bs-theme="dark"] .modal-title {
  color: #dde3ef !important;
  font-weight: 700 !important;
  letter-spacing: -0.01em;
}
[data-bs-theme="dark"] .modal .btn-close {
  filter: invert(1) grayscale(100%) brightness(1.35);
  opacity: 0.72;
}
[data-bs-theme="dark"] .modal .btn-close:hover {
  opacity: 1;
}
[data-bs-theme="dark"] .btn,
[data-bs-theme="dark"] .dropdown-item,
[data-bs-theme="dark"] .nav-link,
[data-bs-theme="dark"] .list-group-item-action {
  transition: transform .15s ease, box-shadow .2s ease, border-color .2s ease, background-color .2s ease, color .2s ease !important;
}
[data-bs-theme="dark"] .btn-primary:hover,
[data-bs-theme="dark"] .btn-teal:hover,
[data-bs-theme="dark"] .btn-blue:hover,
[data-bs-theme="dark"] .btn-info:hover {
  transform: translateY(-1px);
}
[data-bs-theme="dark"] .btn-secondary,
[data-bs-theme="dark"] .btn-light,
[data-bs-theme="dark"] .btn-outline-secondary {
  background: rgba(100,116,139,0.18) !important;
  border-color: rgba(148,163,184,0.22) !important;
  color: #cbd5e1 !important;
}
[data-bs-theme="dark"] .btn-secondary:hover,
[data-bs-theme="dark"] .btn-light:hover,
[data-bs-theme="dark"] .btn-outline-secondary:hover,
[data-bs-theme="dark"] .btn-flush-dark:hover,
[data-bs-theme="dark"] .btn-white:hover,
[data-bs-theme="dark"] .btn-soft-primary:hover,
[data-bs-theme="dark"] .btn-soft-blue:hover,
[data-bs-theme="dark"] .btn-soft-info:hover,
[data-bs-theme="dark"] .btn-outline-primary:hover,
[data-bs-theme="dark"] .btn-outline-blue:hover,
[data-bs-theme="dark"] .btn-outline-info:hover {
  color: #ffffff !important;
}
[data-bs-theme="dark"] .btn:hover svg,
[data-bs-theme="dark"] .btn:focus svg {
  color: currentColor !important;
  stroke: currentColor !important;
}
[data-bs-theme="dark"] .card {
  border: 1px solid rgba(59,130,246,0.12) !important;
  border-radius: 14px !important;
  box-shadow: 0 1px 0 rgba(255,255,255,0.02) inset, 0 10px 30px rgba(2,6,23,0.55) !important;
  overflow: hidden;
}
[data-bs-theme="dark"] .card-header {
  background: linear-gradient(180deg, rgba(59,130,246,0.06), transparent) !important;
  border-bottom-color: rgba(59,130,246,0.12) !important;
}
[data-bs-theme="dark"] .card:hover {
  border-color: rgba(59,130,246,0.28) !important;
  box-shadow: 0 1px 0 rgba(255,255,255,0.03) inset, 0 18px 44px rgba(2,6,23,0.6), 0 0 0 1px rgba(59,130,246,0.12), 0 0 40px -10px rgba(59,130,246,0.35) !important;
}
[data-bs-theme="dark"] .table-responsive,
[data-bs-theme="dark"] .table-wrap,
[data-bs-theme="dark"] .dataTables_wrapper {
  border-color: rgba(59,130,246,0.12) !important;
}
[data-bs-theme="dark"] .table thead th {
  background: #1c2748 !important;
  color: #dde3ef !important;
  border-bottom-color: rgba(59,130,246,0.16) !important;
}
[data-bs-theme="dark"] .table tbody tr,
[data-bs-theme="dark"] .table tbody tr > td,
[data-bs-theme="dark"] .table tbody tr > th {
  background-color: transparent !important;
  box-shadow: none !important;
}
[data-bs-theme="dark"] .table tbody tr:hover > * {
  --bs-table-bg-state: transparent !important;
  background-color: rgba(59,130,246,0.10) !important;
  box-shadow: inset 0 1px 0 rgba(59,130,246,0.08), inset 0 -1px 0 rgba(59,130,246,0.08) !important;
  color: #dde3ef !important;
}
[data-bs-theme="dark"] .text-muted,
[data-bs-theme="dark"] small.text-muted,
[data-bs-theme="dark"] .form-text {
  color: #8d97b0 !important;
}
[data-bs-theme="dark"] .empty-state,
[data-bs-theme="dark"] .no-data,
[data-bs-theme="dark"] .placeholder-state,
[data-bs-theme="dark"] .upload-zone,
[data-bs-theme="dark"] .dropzone,
[data-bs-theme="dark"] .bg-light.border,
[data-bs-theme="dark"] .rounded.bg-light {
  background: linear-gradient(135deg, rgba(28,39,72,0.92), rgba(20,29,53,0.92)) !important;
  border-color: rgba(59,130,246,0.22) !important;
  color: #c9d1e0 !important;
}
[data-bs-theme="dark"] .progress {
  background-color: #1c2748 !important;
  border: 1px solid rgba(59,130,246,0.14) !important;
}
[data-bs-theme="dark"] .progress-bar.bg-primary,
[data-bs-theme="dark"] .progress-bar:not(.bg-success):not(.bg-danger):not(.bg-warning) {
  background: linear-gradient(135deg,#3b82f6 0%,#2563eb 100%) !important;
}
[data-bs-theme="dark"] .tooltip-inner {
  background-color: #1f2937 !important;
  color: #ffffff !important;
  border: 1px solid rgba(59,130,246,0.3) !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
}
[data-bs-theme="dark"] .tooltip .tooltip-arrow::before {
  border-top-color: #1f2937 !important;
}
[data-bs-theme="dark"] .fmapp-wrap .fmapp-sidebar,
[data-bs-theme="dark"] .financialapp-wrap .fmapp-sidebar,
[data-bs-theme="dark"] .documentsapp-wrap .fmapp-sidebar,
[data-bs-theme="dark"] .monitoringapp-wrap .fmapp-sidebar,
[data-bs-theme="dark"] .usersapp-wrap .fmapp-sidebar,
[data-bs-theme="dark"] .adminapp-wrap .fmapp-sidebar {
  background: #0f172a !important;
  border-right: 1px solid rgba(59,130,246,0.14) !important;
  box-shadow: inset -1px 0 0 rgba(59,130,246,0.06) !important;
}
[data-bs-theme="dark"] .fmapp-wrap .fmapp-sidebar .nav-link,
[data-bs-theme="dark"] .financialapp-wrap .fmapp-sidebar .nav-link,
[data-bs-theme="dark"] .documentsapp-wrap .fmapp-sidebar .nav-link,
[data-bs-theme="dark"] .monitoringapp-wrap .fmapp-sidebar .nav-link,
[data-bs-theme="dark"] .usersapp-wrap .fmapp-sidebar .nav-link,
[data-bs-theme="dark"] .adminapp-wrap .fmapp-sidebar .nav-link {
  border-radius: 0 10px 10px 0 !important;
  color: #8d97b0 !important;
}
.fmapp-wrap .fmapp-sidebar .nav-link,
.financialapp-wrap .fmapp-sidebar .nav-link,
.documentsapp-wrap .fmapp-sidebar .nav-link,
.monitoringapp-wrap .fmapp-sidebar .nav-link,
.usersapp-wrap .fmapp-sidebar .nav-link,
.adminapp-wrap .fmapp-sidebar .nav-link {
  display: flex !important;
  align-items: center !important;
  min-height: 42px !important;
  gap: 0.625rem !important;
}
.fmapp-wrap .fmapp-sidebar .nav-link.btn-link,
.financialapp-wrap .fmapp-sidebar .nav-link.btn-link,
.documentsapp-wrap .fmapp-sidebar .nav-link.btn-link,
.monitoringapp-wrap .fmapp-sidebar .nav-link.btn-link,
.usersapp-wrap .fmapp-sidebar .nav-link.btn-link,
.adminapp-wrap .fmapp-sidebar .nav-link.btn-link {
  text-decoration: none !important;
  white-space: nowrap !important;
}
.fmapp-wrap .fmapp-sidebar .nav-link .nav-icon-wrap,
.financialapp-wrap .fmapp-sidebar .nav-link .nav-icon-wrap,
.documentsapp-wrap .fmapp-sidebar .nav-link .nav-icon-wrap,
.monitoringapp-wrap .fmapp-sidebar .nav-link .nav-icon-wrap,
.usersapp-wrap .fmapp-sidebar .nav-link .nav-icon-wrap,
.adminapp-wrap .fmapp-sidebar .nav-link .nav-icon-wrap {
  flex: 0 0 auto !important;
}
.fmapp-wrap .fmapp-sidebar .nav-link .nav-link-text,
.financialapp-wrap .fmapp-sidebar .nav-link .nav-link-text,
.documentsapp-wrap .fmapp-sidebar .nav-link .nav-link-text,
.monitoringapp-wrap .fmapp-sidebar .nav-link .nav-link-text,
.usersapp-wrap .fmapp-sidebar .nav-link .nav-link-text,
.adminapp-wrap .fmapp-sidebar .nav-link .nav-link-text {
  min-width: 0 !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}
[data-bs-theme="dark"] .fmapp-wrap .fmapp-sidebar .nav-link:hover,
[data-bs-theme="dark"] .financialapp-wrap .fmapp-sidebar .nav-link:hover,
[data-bs-theme="dark"] .documentsapp-wrap .fmapp-sidebar .nav-link:hover,
[data-bs-theme="dark"] .monitoringapp-wrap .fmapp-sidebar .nav-link:hover,
[data-bs-theme="dark"] .usersapp-wrap .fmapp-sidebar .nav-link:hover,
[data-bs-theme="dark"] .adminapp-wrap .fmapp-sidebar .nav-link:hover {
  background: linear-gradient(90deg, rgba(59,130,246,0.12), transparent 80%) !important;
  color: #e9e4ff !important;
}
[data-bs-theme="dark"] .fmapp-wrap .fmapp-sidebar .nav-item.active > .nav-link,
[data-bs-theme="dark"] .financialapp-wrap .fmapp-sidebar .nav-item.active > .nav-link,
[data-bs-theme="dark"] .documentsapp-wrap .fmapp-sidebar .nav-item.active > .nav-link,
[data-bs-theme="dark"] .monitoringapp-wrap .fmapp-sidebar .nav-item.active > .nav-link,
[data-bs-theme="dark"] .usersapp-wrap .fmapp-sidebar .nav-item.active > .nav-link,
[data-bs-theme="dark"] .adminapp-wrap .fmapp-sidebar .nav-item.active > .nav-link {
  background: linear-gradient(90deg, rgba(59,130,246,0.22), rgba(59,130,246,0.04) 70%, transparent) !important;
  border-left: 3px solid #3b82f6 !important;
  box-shadow: inset 0 0 0 1px rgba(59,130,246,0.18) !important;
  color: #ffffff !important;
}
[data-bs-theme="dark"] .fmapp-wrap .fmapp-fixednav,
[data-bs-theme="dark"] .financialapp-wrap .fmapp-fixednav,
[data-bs-theme="dark"] .documentsapp-wrap .fmapp-fixednav,
[data-bs-theme="dark"] .monitoringapp-wrap .fmapp-fixednav,
[data-bs-theme="dark"] .usersapp-wrap .fmapp-fixednav,
[data-bs-theme="dark"] .adminapp-wrap .fmapp-fixednav {
  background: #141d35 !important;
  border-top: 1px solid rgba(59,130,246,0.14) !important;
}
[data-bs-theme="light"] {
  --tms-blue: #3b82f6;
  --tms-blue-strong: #2563eb;
  --tms-indigo: #6366f1;
}
[data-bs-theme="light"] .card {
  border: 1px solid rgba(59,130,246,0.08);
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(15,23,42,0.04), 0 4px 14px -6px rgba(15,23,42,0.08);
  transition: transform .15s ease, box-shadow .2s ease, border-color .2s ease;
}
[data-bs-theme="light"] .card:hover {
  border-color: rgba(59,130,246,0.20);
  box-shadow: 0 4px 8px rgba(15,23,42,0.06), 0 12px 28px -10px rgba(59,130,246,0.18);
}
[data-bs-theme="light"] .btn-primary {
  background: linear-gradient(135deg,#3b82f6 0%,#2563eb 100%) !important;
  border-color: transparent !important;
  box-shadow: 0 4px 12px -4px rgba(59,130,246,0.5), 0 1px 2px rgba(37,99,235,0.15) !important;
}
[data-bs-theme="light"] .btn-primary:hover {
  background: linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%) !important;
  transform: translateY(-1px);
}
[data-bs-theme="light"] .modal-content {
  border: 1px solid rgba(59,130,246,0.10);
  border-radius: 14px;
  box-shadow: 0 24px 60px rgba(15,23,42,0.18);
  overflow: hidden;
}
[data-bs-theme="light"] .modal-header {
  background: linear-gradient(180deg, rgba(59,130,246,0.05), transparent);
  border-bottom-color: rgba(59,130,246,0.10);
}
[data-bs-theme="light"] .modal-footer {
  border-top-color: rgba(59,130,246,0.10);
}

/* Subtle backgrounds Bootstrap — dark mode com contraste do design system */
[data-bs-theme="dark"] .bg-primary-subtle,
[data-bs-theme="dark"] .bg-info-subtle {
  background-color: rgba(59,130,246,0.14) !important;
  color: #c9d1e0 !important;
}
[data-bs-theme="dark"] .bg-success-subtle {
  background-color: rgba(34,197,94,0.14) !important;
  color: #c9d1e0 !important;
}
[data-bs-theme="dark"] .bg-warning-subtle {
  background-color: rgba(245,158,11,0.14) !important;
  color: #c9d1e0 !important;
}
[data-bs-theme="dark"] .bg-danger-subtle {
  background-color: rgba(239,68,68,0.14) !important;
  color: #c9d1e0 !important;
}
[data-bs-theme="dark"] .bg-secondary-subtle,
[data-bs-theme="dark"] .bg-light-subtle {
  background-color: rgba(148,163,184,0.10) !important;
  color: #c9d1e0 !important;
}
[data-bs-theme="dark"] .border-primary,
[data-bs-theme="dark"] .border-info {
  border-color: rgba(59,130,246,0.45) !important;
}
[data-bs-theme="dark"] .border-success {
  border-color: rgba(34,197,94,0.45) !important;
}
[data-bs-theme="dark"] .border-warning {
  border-color: rgba(245,158,11,0.45) !important;
}
[data-bs-theme="dark"] .border-danger {
  border-color: rgba(239,68,68,0.45) !important;
}
[data-bs-theme="dark"] .card-header.bg-primary-subtle,
[data-bs-theme="dark"] .card-header.bg-info-subtle,
[data-bs-theme="dark"] .card-header.bg-success-subtle,
[data-bs-theme="dark"] .card-header.bg-warning-subtle,
[data-bs-theme="dark"] .card-header.bg-danger-subtle {
  border-bottom-color: rgba(59,130,246,0.18) !important;
}
[data-bs-theme="dark"] .finance-health-stat,
[data-bs-theme="dark"] .finance-health-stat .text-muted,
[data-bs-theme="dark"] .finance-health-stat small {
  color: #c9d1e0 !important;
}

/* Nav pills (ex.: menu interno de Perfil da Empresa) — design system */
.nav-pills .nav-link {
  color: var(--bs-body-color) !important;
  border-radius: 10px !important;
  transition: background-color .2s ease, color .2s ease, box-shadow .2s ease !important;
}
.nav-pills .nav-link:hover:not(.active) {
  background: rgba(59,130,246,0.10) !important;
  color: #1d4ed8 !important;
}
.nav-pills .nav-link.active,
.nav-pills .show > .nav-link {
  background: linear-gradient(135deg,#3b82f6 0%,#2563eb 100%) !important;
  color: #ffffff !important;
  box-shadow: 0 6px 16px -6px rgba(59,130,246,0.55), 0 1px 2px rgba(37,99,235,0.18) !important;
}
[data-bs-theme="dark"] .nav-pills .nav-link {
  color: #c9d1e0 !important;
}
[data-bs-theme="dark"] .nav-pills .nav-link:hover:not(.active) {
  background: rgba(59,130,246,0.16) !important;
  color: #e9e4ff !important;
}
[data-bs-theme="dark"] .nav-pills .nav-link.active,
[data-bs-theme="dark"] .nav-pills .show > .nav-link {
  background: linear-gradient(135deg,#3b82f6 0%,#2563eb 100%) !important;
  color: #ffffff !important;
}

`;

const DARK_ROOT_VARS = {
  '--bs-body-bg': '#0f172a',
  '--bs-body-bg-rgb': '15,23,42',
  '--bs-body-color': '#c9d1e0',
  '--bs-body-color-rgb': '201,209,224',
  '--bs-border-color': '#2a2f3d',
  '--bs-border-color-translucent': 'rgba(255,255,255,0.08)',
  '--bs-secondary-bg': '#141d35',
  '--bs-secondary-bg-rgb': '29,40,71',
  '--bs-tertiary-bg': '#191c27',
  '--bs-tertiary-bg-rgb': '25,28,39',
  '--bs-emphasis-color': '#f0f3f8',
  '--bs-heading-color': '#dde3ef',
  '--bs-secondary-color': 'rgba(201,209,224,0.65)',
  '--bs-tertiary-color': 'rgba(201,209,224,0.40)',
  '--bs-link-color': '#7eb8ff',
  '--bs-black': '#c9d1e0',
};

const LIGHT_ROOT_VARS_TO_REMOVE = Object.keys(DARK_ROOT_VARS);

function applyDarkStyles(isDark) {
  const root = document.documentElement;
  const existing = document.getElementById(DARK_STYLE_ID);

  if (isDark) {
    // Sobrescreve as CSS vars diretamente no :root (maior especificidade)
    Object.entries(DARK_ROOT_VARS).forEach(([key, val]) => {
      root.style.setProperty(key, val);
    });
    // Remove existing (likely in <head> from inline script) and re-inject in <body> for higher cascade order
    if (existing) existing.remove();
    const style = document.createElement('style');
    style.id = DARK_STYLE_ID;
    style.textContent = DARK_CSS;
    // Append to body so it appears after all head stylesheets in cascade
    document.body ? document.body.appendChild(style) : document.head.appendChild(style);
  } else {
    // Remove as overrides do root
    LIGHT_ROOT_VARS_TO_REMOVE.forEach((key) => {
      root.style.removeProperty(key);
    });
    if (existing) existing.remove();
  }
}

// ── Store compartilhado entre todas as instâncias do hook ──────────────
// Antes, cada componente tinha seu próprio useState → ao trocar o tema
// no TopNav, apenas aquele componente re-renderizava. Outros (como o
// FleetDashboardBody que usa className={isDark ? ... : ...}) ficavam
// com o className do tema antigo até o refresh sincronizar via localStorage.
// Agora usamos um store externo com useSyncExternalStore para que todos
// os consumidores re-renderizem juntos quando o tema mudar.

let currentMode = null;
const listeners = new Set();

function getSnapshot() {
  return currentMode;
}

// Snapshot usado durante SSR — sempre 'light' para evitar mismatch de hidratação
function getServerSnapshot() {
  return 'light';
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  listeners.forEach((fn) => fn());
}

function applyMode(next) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-bs-theme', next);
  applyDarkStyles(next === 'dark');
}

function setModeShared(next) {
  if (currentMode === next) return;
  currentMode = next;
  applyMode(next);
  try { localStorage.setItem(COLOR_MODE_KEY, next); } catch {}
  emit();
}

// Inicializa o store uma única vez no client
if (typeof window !== 'undefined' && currentMode === null) {
  try {
    const saved = localStorage.getItem(COLOR_MODE_KEY);
    currentMode = saved === 'dark' ? 'dark' : 'light';
  } catch {
    currentMode = 'light';
  }
  // Garante que o DOM reflita o estado inicial (caso o script inline
  // no layout.js não tenha rodado ou tenha divergido)
  applyMode(currentMode);

  // Sincroniza entre abas do mesmo domínio
  window.addEventListener('storage', (e) => {
    if (e.key !== COLOR_MODE_KEY) return;
    const next = e.newValue === 'dark' ? 'dark' : 'light';
    if (next !== currentMode) {
      currentMode = next;
      applyMode(next);
      emit();
    }
  });
}

export function useColorMode() {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Garante aplicação dos estilos quando este hook monta em uma tela
  // que não rodou a inicialização (edge case de rotas isoladas).
  useEffect(() => {
    if (currentMode) applyMode(currentMode);
  }, []);

  const toggle = useCallback(() => {
    setModeShared(currentMode === 'dark' ? 'light' : 'dark');
  }, []);

  const setDark = useCallback(() => setModeShared('dark'), []);
  const setLight = useCallback(() => setModeShared('light'), []);

  return { mode, toggle, setDark, setLight, isDark: mode === 'dark' };
}
