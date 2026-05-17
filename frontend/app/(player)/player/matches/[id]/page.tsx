'use client';

import { useState, useEffect, use } from 'react';
import { MatchDetail } from '@/features/matches/match-detail';
import { BookingFlow } from '@/features/bookings/booking-flow';
import { useApi } from '@/lib/use-api';
import type { Match, Booking } from '@/lib/api-types';

interface MatchPageProps {
  params: Promise<{ id: string }>;
}

const BOOKING_STATUS_LABEL: Record<string, string> = {
  pending: 'Reserva pendente',
  confirmed: 'Reservado — horário bloqueado',
  cancelled: 'Reserva cancelada',
};

export default function MatchDetailPage({ params }: MatchPageProps) {
  const { id } = use(params);
  const api = useApi();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.matches
      .getMatch(id)
      .then((m) => {
        if (!cancelled) setMatch(m);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Erro ao carregar jogo.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [api.matches, id]);

  if (loading) {
    return <p className="page-center" aria-live="polite">A carregar jogo…</p>;
  }

  if (error || !match) {
    return <p className="form-error" role="alert">{error ?? 'Jogo não encontrado.'}</p>;
  }

  return (
    <div className="match-page">
      {booking && (
        <div
          className={`match-page__booking-status match-page__booking-status--${booking.status}`}
          role="status"
          aria-live="polite"
          aria-label={`Estado da reserva: ${BOOKING_STATUS_LABEL[booking.status] ?? booking.status}`}
        >
          {BOOKING_STATUS_LABEL[booking.status] ?? booking.status}
        </div>
      )}

      <section className="page-hero">
        <MatchDetail
          match={match}
          onMatchUpdated={setMatch}
          onBookSlot={() => setShowBooking(true)}
        />
      </section>

      {showBooking && !booking && (
        <section className="page-hero">
          <BookingFlow
            matchId={match.id}
            onBooked={(b: Booking) => {
              setBooking(b);
              setShowBooking(false);
            }}
            onCancel={() => setShowBooking(false)}
          />
        </section>
      )}
    </div>
  );
}
