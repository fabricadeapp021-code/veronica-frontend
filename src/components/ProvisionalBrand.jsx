'use client';

import Link from 'next/link';

export default function ProvisionalBrand({
  href = '/',
  compact = false,
  centered = false,
  inverse = false,
  className = '',
}) {
  const color = inverse ? '#ffffff' : '#111827';
  const subColor = inverse ? 'rgba(255,255,255,0.72)' : '#64748b';

  return (
    <Link
      href={href}
      className={`text-decoration-none d-inline-flex align-items-center gap-2 ${centered ? 'justify-content-center' : ''} ${className}`}
      style={{ color }}
      aria-label="OpenClaw SaaS"
    >
      <span
        className="d-inline-flex align-items-center justify-content-center fw-bold"
        style={{
          width: compact ? 36 : 42,
          height: compact ? 36 : 42,
          borderRadius: 10,
          color: '#fff',
          background: 'linear-gradient(135deg, #2563eb 0%, #14b8a6 100%)',
          boxShadow: '0 10px 24px rgba(37, 99, 235, 0.25)',
          letterSpacing: 0,
          flex: '0 0 auto',
        }}
      >
        OC
      </span>
      {!compact && (
        <span className="d-flex flex-column" style={{ lineHeight: 1.05 }}>
          <span className="fw-bold" style={{ color, fontSize: 18, letterSpacing: 0 }}>
            OpenClaw
          </span>
          <span className="fw-medium" style={{ color: subColor, fontSize: 11, letterSpacing: 0 }}>
            SaaS Control UI
          </span>
        </span>
      )}
    </Link>
  );
}
