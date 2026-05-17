'use client';

import { useRouter } from 'next/navigation';
import { CreateMatchForm } from '@/features/matches/create-match-form';
import type { Match } from '@/lib/api-types';

export default function CreateMatchPage() {
  const router = useRouter();

  function handleSuccess(match: Match) {
    router.push(`/player/matches/${match.id}`);
  }

  function handleCancel() {
    router.back();
  }

  return (
    <section className="page-hero">
      <h1>Criar jogo</h1>
      <CreateMatchForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </section>
  );
}
