'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { InviteShare } from './invite-share';
import { useApi } from '@/lib/use-api';
import { useAuth } from '@/features/auth/auth-context';
import type { Match } from '@/lib/api-types';

const FORMAT_LABEL: Record<string, string> = {
  singles: 'Singles',
  doubles: 'Doubles',
};

const SKILL_LABEL: Record<string, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermédio',
  advanced: 'Avançado',
};

const STATUS_LABEL: Record<string, string> = {
  forming: 'A formar equipa',
  open: 'Aberto',
  ready_to_book: 'Pronto para reservar',
  booked: 'Reservado',
  cancelled: 'Cancelado',
};

interface MatchDetailProps {
  match: Match;
  onMatchUpdated: (match: Match) => void;
  onBookSlot?: () => void;
}

export function MatchDetail({ match, onMatchUpdated, onBookSlot }: MatchDetailProps) {
  const api = useApi();
  const { user } = useAuth();
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const mySpot = match.spots.find((s) => s.playerId === user?.id);
  const openSpots = match.spots.filter((s) => s.status === 'open').length;
  const isOrganizer = match.creatorId === user?.id;
  const canJoin = !mySpot && openSpots > 0 && match.status !== 'booked' && match.status !== 'cancelled';
  const canLeave = !!mySpot;
  const canBook = isOrganizer && (match.status === 'forming' || match.status === 'open' || match.status === 'ready_to_book');

  async function handleJoin() {
    setActionError(null);
    setJoining(true);
    try {
      await api.matches.joinSpot(match.id);
      const updated = await api.matches.getMatch(match.id);
      onMatchUpdated(updated);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Erro ao juntar-se ao jogo.');
    } finally {
      setJoining(false);
    }
  }

  async function handleLeave() {
    setActionError(null);
    setLeaving(true);
    try {
      await api.matches.leaveSpot(match.id);
      const updated = await api.matches.getMatch(match.id);
      onMatchUpdated(updated);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Erro ao sair do jogo.');
    } finally {
      setLeaving(false);
    }
  }

  return (
    <div className="match-detail">
      <div className="match-detail__header">
        <div className="match-detail__meta">
          <span className="match-card__format">{FORMAT_LABEL[match.format] ?? match.format}</span>
          <span className="match-card__skill">{SKILL_LABEL[match.skillLevel] ?? match.skillLevel}</span>
          <span className={`match-detail__status match-detail__status--${match.status}`}>
            {STATUS_LABEL[match.status] ?? match.status}
          </span>
        </div>

        {match.notes && (
          <p className="match-detail__notes">{match.notes}</p>
        )}
      </div>

      {/* Spots — visually distinct from slot booking */}
      <section className="match-detail__spots" aria-label="Vagas no jogo">
        <h2 className="match-detail__section-title">
          Vagas no jogo <span className="match-detail__spots-count">({openSpots} livre{openSpots !== 1 ? 's' : ''})</span>
        </h2>
        <ul className="spot-list" role="list">
          {match.spots.map((spot) => (
            <li
              key={spot.id}
              className={`spot-list__item spot-list__item--${spot.status}${spot.playerId === user?.id ? ' spot-list__item--mine' : ''}`}
              aria-label={
                spot.status === 'filled'
                  ? spot.playerId === user?.id
                    ? 'A minha vaga'
                    : 'Vaga ocupada'
                  : 'Vaga disponível'
              }
            >
              {spot.status === 'filled' ? (
                spot.playerId === user?.id ? '● Você' : '● Jogador'
              ) : (
                '○ Vaga livre'
              )}
            </li>
          ))}
        </ul>
      </section>

      {actionError && (
        <p className="form-error" role="alert">{actionError}</p>
      )}

      {/* CTAs — sticky on mobile */}
      <div className="match-detail__actions match-detail__sticky-bar">
        {canJoin && (
          <Button onClick={() => void handleJoin()} disabled={joining}>
            {joining ? 'A juntar…' : 'Juntar-me ao jogo'}
          </Button>
        )}
        {canLeave && (
          <Button variant="secondary" onClick={() => void handleLeave()} disabled={leaving}>
            {leaving ? 'A sair…' : 'Sair do jogo'}
          </Button>
        )}
        {canBook && onBookSlot && (
          <Button variant="secondary" onClick={onBookSlot}>
            Reservar horário de court →
          </Button>
        )}
      </div>

      {/* Invite section — only for invite matches */}
      {match.visibility === 'invite' && match.inviteCode && (
        <section className="match-detail__invite" aria-label="Convite">
          <h2 className="match-detail__section-title">Partilhar convite</h2>
          <InviteShare inviteCode={match.inviteCode} />
        </section>
      )}
    </div>
  );
}
