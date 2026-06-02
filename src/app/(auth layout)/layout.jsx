'use client'
import classNames from 'classnames'
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const AuthLayout = ({ children }) => {
    const pathName = usePathname();
    const lockScreenAuth = pathName.match('/auth/lock-screen');

    useEffect(() => {
        const root = document.documentElement;
        const prevTheme = root.getAttribute('data-bs-theme');
        const darkStyle = document.getElementById('__dark-mode-overrides__');

        // Força modo claro: remove data-bs-theme="dark" do <html> e oculta o dark style
        root.setAttribute('data-bs-theme', 'light');
        if (darkStyle) darkStyle.disabled = true;

        return () => {
            // Restaura ao navegar para fora da tela de auth
            if (prevTheme) root.setAttribute('data-bs-theme', prevTheme);
            if (darkStyle) darkStyle.disabled = false;
        };
    }, []);

    return (
        <div
            className={classNames("hk-wrapper hk-pg-auth", { "bg-primary-dark-3": lockScreenAuth })}
            data-footer="simple"
            data-bs-theme="light"
        >
            {children}
        </div>
    )
}

export default AuthLayout
