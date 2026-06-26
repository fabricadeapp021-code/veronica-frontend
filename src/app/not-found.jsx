'use client'
import Link from 'next/link';

const Error404 = () => {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
        }}>
            <div style={{ textAlign: 'center', maxWidth: '480px', width: '100%' }}>

                {/* Glyph visual */}
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="40" cy="40" r="38" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 4" opacity="0.35" />
                        <circle cx="40" cy="40" r="26" stroke="#3b82f6" strokeWidth="1.5" opacity="0.2" />
                        <path d="M40 22 L40 42" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                        <circle cx="40" cy="52" r="3" fill="#3b82f6" />
                    </svg>
                </div>

                {/* 404 number */}
                <div style={{
                    fontSize: '7rem',
                    fontWeight: 800,
                    lineHeight: 1,
                    letterSpacing: '-0.04em',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: '1rem',
                    userSelect: 'none',
                }}>
                    404
                </div>

                {/* Title */}
                <h1 style={{
                    fontSize: '1.375rem',
                    fontWeight: 700,
                    marginBottom: '0.625rem',
                    letterSpacing: '-0.01em',
                }}>
                    Página não encontrada
                </h1>

                {/* Description */}
                <p className="text-muted" style={{
                    fontSize: '0.9375rem',
                    marginBottom: '2rem',
                    lineHeight: 1.6,
                }}>
                    A rota que você acessou não existe ou foi movida.
                    Verifique o endereço ou volte ao painel de agentes.
                </p>

                {/* Action */}
                <Link
                    href="/apps/agents"
                    className="btn btn-primary"
                    style={{
                        padding: '0.625rem 1.75rem',
                        fontWeight: 600,
                        borderRadius: '0.625rem',
                        fontSize: '0.9375rem',
                    }}
                >
                    Ir para Agentes
                </Link>
            </div>
        </div>
    );
};

export default Error404;
