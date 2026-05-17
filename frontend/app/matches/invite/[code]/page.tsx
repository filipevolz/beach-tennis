'use client';

import { useState, useEffect, use } from 'react';
import { MatchDetail } from '@/features/matches/match-detail';
import { BookingFlow } from '@/features/bookings/booking-flow';
import { useApi } from '@/lib/use-api';
import { useAuth } from '@/features/auth/auth-context';
import type { Match, Booking } from '@/lib/api-types';

interface InvitePageProps {
  params: Promise<{ code: string }>;
}

export default function InviteMatchPage({ params }: InvitePageProps) {
  const { code } = use(params);
  const api = useApi();
  const { user } = useAuth();

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.matches
      .getMatchByInviteCode(code)
      .then((m) => {
        if (!cancelled) setMatch(m);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Convite não encontrado ou expirado.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [api.matches, code]);

  if (loading) {
    return (
      <main className="page-center" style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p aria-live="polite">A carregar convite…</p>
      </main>
    );
  }

  if (error || !match) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <h1>Convite inválido</h1>
          <p className="form-error" role="alert">{error ?? 'Este link de convite não é válido.'}</p>
          {!user && (
            <p>
              <a href="/login">Inicie sessão</a> para aceder a jogos privados.
            </p>
          )}
        </div>
      </main>
    );
  }

  const handleBooked = (b: Booking) => {
    setBooking(b);
    setShowBooking(false);
  };

  return (
    <main style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
      <div className="invite-page__header">
        <p className="geo-filter__status">Você foi convidado para este jogo privado.</p>
      </div>

      {booking && (
        <div
          className={`match-page__booking-status match-page__booking-status--${booking.status}`}
          role="status"
          aria-live="polite"
        >
          {booking.status === 'confirmed' ? 'Horário de court reservado!' : 'Reserva pendente criada.'}
        </div>
      )}

      <div className="page-hero">
        <MatchDetail
          match={match}
          onMatchUpdated={setMatch}
          onBookSlot={() => setShowBooking(true)}
        />
      </div>

      {showBooking && !booking && (
        <div className="page-hero">
          <BookingFlow
            matchId={match.id}
            onBooked={handleBooked}
            onCancel={() => setShowBooking(false)}
          />
        </div>
      )}

      {!user && (
        <div className="page-hero" style={{ textAlign: 'center' }}>
          <p>Para se juntar ao jogo, precisa de uma conta.</p>
          <a href={`/login?next=/matches/invite/${code}`}>Iniciar sessão</a>
          {' · '}
          <a href="/register">Registar</a>
        </div>
      )}
    </main>
  );
}
