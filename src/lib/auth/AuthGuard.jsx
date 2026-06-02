'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';

export function AuthGuard({ children }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'guest') {
      const returnTo = pathname || '/apps/users/list';
      router.replace(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }, [status, router, pathname]);

  if (status === 'loading') {
    return (
      <div className="hk-pg-wrapper py-0">
        <div className="hk-pg-body py-0">
          <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
            <div className="text-muted">Carregando…</div>
          </div>
        </div>
      </div>
    );
  }

  if (status !== 'authenticated') return null;
  return children;
}
