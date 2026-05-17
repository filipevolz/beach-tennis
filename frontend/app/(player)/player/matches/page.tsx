'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useApi } from '@/lib/use-api';
import { useAuth } from '@/features/auth/auth-context';
import type { Match } from '@/lib/api-types';

const FORMAT_LABEL: Record<string, string> = {
  singles: 'Singles',
  doubles: 'Doubles',
};

const STATUS_LABEL: Record<string, string> = {
  forming: 'A formar',
  open: 'Aberto',
  ready_to_book: 'Pronto p/ reservar',
  booked: 'Reservado',
  cancelled: 'Cancelado',
};

export default function PlayerMatchesPage() {
  const api = useApi();
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.matches
      .listPublicMatches()
      .then((data) => {
        if (!cancelled) {
          const mine = data.filter(
            (m) =>
              m.creatorId === user?.id ||
              m.spots.some((s) => s.playerId === user?.id),
          );
          setMatches(mine);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Erro ao carregar jogos.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [api.matches, user?.id]);

  return (
    <div className="player-matches-page">
      <div className="page-hero">
        <div className="discover-page__title-row">
          <h1>Os meus jogos</h1>
          <Link href="/player/matches/create">
            <Button>+ Criar jogo</Button>
          </Link>
        </div>
      </div>

      {loading && <p className="page-center" aria-live="polite">A carregar…</p>}
      {error && <p className="form-error" role="alert">{error}</p>}

      {!loading && !error && matches.length === 0 && (
        <p className="page-center">
          Ainda não participa em nenhum jogo.{' '}
          <Link href="/player/discover">Descubra jogos</Link> ou crie o seu.
        </p>
      )}

      {matches.length > 0 && (
        <ul className="match-list page-hero" role="list">
          {matches.map((match) => (
            <li key={match.id} className="match-card">
              <Link href={`/player/matches/${match.id}`} className="match-card__link">
                <div className="match-card__header">
                  <span className="match-card__format">{FORMAT_LABEL[match.format]}</span>
                  <span className={`match-detail__status match-detail__status--${match.status}`}>
                    {STATUS_LABEL[match.status] ?? match.status}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
