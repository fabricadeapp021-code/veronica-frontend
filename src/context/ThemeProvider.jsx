'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { getTenantId, getCachedTheme, setCachedTheme } from '@/lib/auth/session';
import { getTheme, getThemePublic } from '@/lib/api/services/theme';

const THEME_STYLE_ID = '__party-theme-overrides__';

const defaultTheme = {
  primaryColor: '',
  secondaryColor: '',
  logoUrl: '',
  dashboardLogoUrl: '',
  description: '',
  loginTitle: '',
  loginRightTitle: '',
  loginRightDescription: '',
};

const ThemeContext = createContext({
  theme: defaultTheme,
  setTheme: () => {},
  isLoading: false,
  refetch: () => {},
});

function readCacheSync() {
  try { return getCachedTheme() || defaultTheme; } catch { return defaultTheme; }
}

export function ThemeProvider({ children }) {
  const { status } = useAuth();
  // Inicializa com cache do localStorage — evita flash na primeira renderização
  const [theme, setThemeState] = useState(() => readCacheSync());
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Converte hex (#rrggbb ou #rgb) para string "r, g, b" usada pelo Bootstrap 5.
   */
  const hexToRgbStr = useCallback((hex) => {
    if (!hex) return null;
    const clean = hex.replace('#', '');
    let r, g, b;
    if (clean.length === 3) {
      r = parseInt(clean[0] + clean[0], 16);
      g = parseInt(clean[1] + clean[1], 16);
      b = parseInt(clean[2] + clean[2], 16);
    } else if (clean.length === 6) {
      r = parseInt(clean.slice(0, 2), 16);
      g = parseInt(clean.slice(2, 4), 16);
      b = parseInt(clean.slice(4, 6), 16);
    } else {
      return null;
    }
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return `${r}, ${g}, ${b}`;
  }, []);

  /**
   * Escurece um hex em N% (para estados hover/active/dark-1).
   */
  const darken = useCallback((hex, pct) => {
    if (!hex) return hex;
    const clean = hex.replace('#', '');
    if (clean.length !== 6) return hex;
    const factor = 1 - pct / 100;
    const r = Math.round(parseInt(clean.slice(0, 2), 16) * factor);
    const g = Math.round(parseInt(clean.slice(2, 4), 16) * factor);
    const b = Math.round(parseInt(clean.slice(4, 6), 16) * factor);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }, []);

  /**
   * Clareia um hex em N% (para estados light-1..5).
   * mix(white, color, pct%) → resultado
   */
  const lighten = useCallback((hex, pct) => {
    if (!hex) return hex;
    const clean = hex.replace('#', '');
    if (clean.length !== 6) return hex;
    const factor = pct / 100;
    const r = Math.round(parseInt(clean.slice(0, 2), 16) + (255 - parseInt(clean.slice(0, 2), 16)) * factor);
    const g = Math.round(parseInt(clean.slice(2, 4), 16) + (255 - parseInt(clean.slice(2, 4), 16)) * factor);
    const b = Math.round(parseInt(clean.slice(4, 6), 16) + (255 - parseInt(clean.slice(4, 6), 16)) * factor);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }, []);

  /**
   * Injeta uma <style> tag com !important sobrescrevendo os valores
   * compilados do SCSS (que usam $primary fixo).
   * O SCSS do projeto usa rgba($primary, ...) e $primary_dark_1 etc.,
   * todos fixos em tempo de compilação — só !important via JS os substitui.
   */
  const injectDynamicStyles = useCallback((primary, secondary) => {
    if (typeof document === 'undefined') return;

    // Remove injeção anterior
    const existing = document.getElementById(THEME_STYLE_ID);
    if (existing) existing.remove();

    if (!primary && !secondary) return;

    const lines = [];

    if (primary) {
      const dark1   = darken(primary, 10);
      const light3  = lighten(primary, 60);
      const light5  = lighten(primary, 92);
      const rgb     = hexToRgbStr(primary);

      lines.push(`
        /* ── btn-primary ── */
        .btn-primary {
          background-color: ${primary} !important;
          border-color: ${primary} !important;
          color: #fff !important;
        }
        .btn-primary:hover,
        .btn-primary:focus {
          background-color: ${dark1} !important;
          border-color: ${dark1} !important;
          color: #fff !important;
        }
        .btn-primary:not(:disabled):not(.disabled).active,
        .btn-primary:not(:disabled):not(.disabled):active {
          background-color: ${dark1} !important;
          border-color: ${dark1} !important;
          color: #fff !important;
        }
        .btn-primary.disabled,
        .btn-primary:disabled {
          background-color: ${light3} !important;
          border-color: ${light3} !important;
        }

        /* ── btn-flush-primary ── */
        .btn-flush-primary {
          color: ${primary} !important;
        }
        .btn-flush-primary:hover,
        .btn-flush-primary:focus {
          background-color: ${primary} !important;
          border-color: ${primary} !important;
          color: #fff !important;
        }
        .btn-flush-primary:not(:disabled):not(.disabled).active,
        .btn-flush-primary:not(:disabled):not(.disabled):active {
          background-color: ${primary} !important;
          border-color: ${primary} !important;
          color: #fff !important;
        }
        .btn-flush-primary.flush-soft-hover:hover,
        .btn-flush-primary.flush-soft-hover:focus {
          color: ${primary} !important;
          background-color: ${light5} !important;
          border-color: ${light5} !important;
        }

        /* ── bg-primary ── */
        .bg-primary { background-color: ${primary} !important; }
        .bg-primary-light-5 { background-color: ${light5} !important; }
        .bg-primary-light-4 { background-color: ${lighten(primary, 78)} !important; }
        .bg-primary-light-3 { background-color: ${light3} !important; }
        .bg-primary-light-2 { background-color: ${lighten(primary, 42)} !important; }
        .bg-primary-light-1 { background-color: ${lighten(primary, 24)} !important; }
        .bg-primary-dark-1  { background-color: ${dark1} !important; }

        /* ── text-primary / links ── */
        .text-primary { color: ${primary} !important; }
        a.text-primary:hover { color: ${dark1} !important; }
        .link-primary { color: ${primary} !important; }
        .link-primary:hover { color: ${dark1} !important; }

        /* ── border-primary ── */
        .border-primary { border-color: ${primary} !important; }

        /* ── navbar/sidebar active states ── */
        .navbar-nav .nav-link.active,
        .nav-pills .nav-link.active,
        .nav-pills .show > .nav-link {
          background-color: ${primary} !important;
          color: #fff !important;
        }
        /* Sidebar: own active styling (light=green tint, dark=navy) */
        .hk-menu .navbar-nav .nav-link.active,
        .hk-menu .navbar-nav .nav-item.active > .nav-link {
          background-color: #f0fdf4 !important;
          color: ${primary} !important;
          border-left: 3px solid ${primary} !important;
          border-radius: 0.5rem !important;
        }

        /* ── form focus ── */
        .form-control:focus,
        .form-select:focus {
          border-color: ${primary} !important;
          box-shadow: 0 0 0 0.2rem rgba(${rgb}, 0.25) !important;
        }

        /* ── checkbox / radio ── */
        .form-check-input:checked {
          background-color: ${primary} !important;
          border-color: ${primary} !important;
        }

        /* ── CSS vars (Bootstrap utilitários que ainda usam var()) ── */
        :root {
          --party-primary: ${primary};
          --bs-primary: ${primary};
          --bs-primary-rgb: ${rgb};
          --party-primary-rgb: ${rgb};
          --bs-link-color: ${primary};
          --bs-link-hover-color: ${dark1};
        }
      `);
    }

    if (secondary) {
      const dark1s  = darken(secondary, 10);
      const light5s = lighten(secondary, 92);
      const rgbs    = hexToRgbStr(secondary);

      lines.push(`
        /* ── btn-secondary ── */
        .btn-secondary {
          background-color: ${secondary} !important;
          border-color: ${secondary} !important;
          color: #fff !important;
        }
        .btn-secondary:hover,
        .btn-secondary:focus {
          background-color: ${dark1s} !important;
          border-color: ${dark1s} !important;
          color: #fff !important;
        }

        /* ── bg-secondary ── */
        .bg-secondary { background-color: ${secondary} !important; }
        .text-secondary { color: ${secondary} !important; }
        .border-secondary { border-color: ${secondary} !important; }

        /* ── CSS vars ── */
        :root {
          --party-secondary: ${secondary};
          --bs-secondary: ${secondary};
          --bs-secondary-rgb: ${rgbs};
          --party-secondary-rgb: ${rgbs};
        }
      `);
    }

    if (lines.length === 0) return;

    const style = document.createElement('style');
    style.id = THEME_STYLE_ID;
    style.textContent = lines.join('\n');
    document.head.appendChild(style);
  }, [darken, lighten, hexToRgbStr]);

  const applyCssVars = useCallback((t) => {
    injectDynamicStyles(t?.primaryColor || null, t?.secondaryColor || null);
  }, [injectDynamicStyles]);

  const fetchTheme = useCallback(async (optimisticData) => {
    // Se temos dados otimistas (ex: após salvar), aplica imediatamente sem flash
    if (optimisticData) {
      setThemeState(optimisticData);
      applyCssVars(optimisticData);
      setCachedTheme(optimisticData);
      return;
    }
    setIsLoading(true);
    try {
      let data;
      if (status === 'authenticated') {
        data = await getTheme();
      } else {
        const tenantId = getTenantId();
        data = tenantId ? await getThemePublic(tenantId) : defaultTheme;
      }
      setThemeState(data);
      applyCssVars(data);
      setCachedTheme(data);
    } catch (err) {
      console.warn('ThemeProvider: falha ao carregar tema', err);
    } finally {
      setIsLoading(false);
    }
  }, [status, applyCssVars]);

  useEffect(() => {
    // Aplica o cache imediatamente (se o script inline não tiver rodado ainda — SSR/hydration)
    const cached = getCachedTheme();
    if (cached?.primaryColor || cached?.secondaryColor) {
      applyCssVars(cached);
    }
    fetchTheme();
  }, [fetchTheme, applyCssVars]);

  const setTheme = useCallback((next) => {
    setThemeState((prev) => (typeof next === 'function' ? next(prev) : { ...defaultTheme, ...next }));
  }, []);

  const value = {
    theme,
    setTheme,
    isLoading,
    refetch: fetchTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: defaultTheme,
      setTheme: () => {},
      isLoading: false,
      refetch: () => {},
    };
  }
  return ctx;
}
