'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Zap } from 'react-feather';
import FleetAiPanel from '@/app/(apps layout)/apps/fleet/_components/FleetAiPanel';

// Fleet pages have their own AI panel via fleet/layout.jsx — don't duplicate
const FLEET_PREFIX = '/apps/fleet';

export default function GlobalAiButton() {
  const pathname  = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname?.startsWith(FLEET_PREFIX)) return null;

  return (
    <>
      <style>{`
        .global-ai-fab {
          position: fixed;
          bottom: 28px;
          right: 28px;
          height: 46px;
          padding: 0 20px 0 14px;
          border-radius: 23px;
          border: none;
          background: linear-gradient(135deg, #0d6efd 0%, #6610f2 100%);
          color: #fff;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 0.84rem;
          cursor: pointer;
          z-index: 1040;
          box-shadow: 0 4px 20px rgba(13,110,253,.40);
          transition: transform .18s ease, box-shadow .18s ease;
          white-space: nowrap;
          letter-spacing: .01em;
        }
        .global-ai-fab:hover {
          transform: translateY(-2px) scale(1.03);
          box-shadow: 0 8px 28px rgba(13,110,253,.55);
        }
        .global-ai-fab:active {
          transform: scale(0.96);
        }
        .global-ai-fab .fab-icon-wrap {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: rgba(255,255,255,.18);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        @media (max-width: 576px) {
          .global-ai-fab { padding: 0; width: 46px; border-radius: 50%; justify-content: center; }
          .global-ai-fab .fab-label { display: none; }
          .global-ai-fab .fab-icon-wrap { background: transparent; width: auto; height: auto; }
        }
      `}</style>

      <button
        className="global-ai-fab"
        onClick={() => setOpen(p => !p)}
        title="Assistente IA"
        aria-label="Abrir assistente IA"
      >
        <span className="fab-icon-wrap">
          <Zap size={15} fill="#fff" color="#fff" />
        </span>
        <span className="fab-label">Assistente IA</span>
      </button>

      <FleetAiPanel
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
