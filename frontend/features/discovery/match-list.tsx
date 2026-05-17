'use client';

import Link from 'next/link';
import type { Match, MatchFormat } from '@/lib/api-types';

const FORMAT_LABEL: Record<MatchFormat, string> = {
  singles: 'Singles',
  doubles: 'Doubles',
};

const SKILL_LABEL: Record<string, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermédio',
  advanced: 'Avançado',
};

function getOpenSpots(match: Match): number {
  return match.spots.filter((s) => s.status === 'open').length;
}

interface MatchCardProps {
  match: Match;
}

function MatchCard({ match }: MatchCardProps) {
  const openSpots = getOpenSpots(match);
  const totalSpots = match.spots.length;

  return (
    <li className="match-card" aria-label={`Jogo ${FORMAT_LABEL[match.format]} — ${SKILL_LABEL[match.skillLevel] ?? match.skillLevel}`}>
      <Link href={`/player/matches/${match.id}`} className="match-card__link">
        <div className="match-card__header">
          <span className="match-card__format">{FORMAT_LABEL[match.format]}</span>
          <span className="match-card__skill">{SKILL_LABEL[match.skillLevel] ?? match.skillLevel}</span>
        </div>

        <div className="match-card__spots">
          <span
            className={`match-card__badge match-card__badge--spots${openSpots === 0 ? ' match-card__badge--full' : ''}`}
            aria-label={`${openSpots} vagas disponíveis de ${totalSpots}`}
          >
            {openSpots === 0
              ? 'Cheio'
              : `${openSpots} vaga${openSpots !== 1 ? 's' : ''}`}
          </span>
        </div>

        {match.notes && (
          <p className="match-card__notes">{match.notes}</p>
        )}

        <div className="match-card__meta">
          <span className="match-card__status match-card__status--join">
            Juntar-me ao jogo →
          </span>
        </div>
      </Link>
    </li>
  );
}

interface MatchListProps {
  matches: Match[];
  loading: boolean;
  error: string | null;
}

export function MatchList({ matches, loading, error }: MatchListProps) {
  if (loading) {
    return <p className="page-center" aria-live="polite">A procurar jogos…</p>;
  }

  if (error) {
    return <p className="form-error" role="alert">{error}</p>;
  }

  if (matches.length === 0) {
    return (
      <p className="page-center">
        Nenhum jogo encontrado perto de si. Tente aumentar o raio ou criar um jogo.
      </p>
    );
  }

  return (
    <ul className="match-list" role="list" aria-label="Lista de jogos">
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} />
      ))}
    </ul>
  );
}
