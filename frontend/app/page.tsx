'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-context';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    router.replace(user.role === 'player' ? '/player' : '/venue');
  }, [isLoading, router, user]);

  return <div className="page-center">A redirecionar…</div>;
}
