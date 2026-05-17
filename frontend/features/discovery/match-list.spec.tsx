import { cleanup, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { MatchList } from './match-list';
import type { Match } from '@/lib/api-types';

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 'match-1',
    creatorId: 'user-1',
    format: 'doubles',
    visibility: 'public',
    skillLevel: 'intermediate',
    latitude: 38.7,
    longitude: -9.1,
    status: 'forming',
    spots: [
      { id: 'spot-1', matchId: 'match-1', playerId: 'user-1', status: 'filled', position: 0 },
      { id: 'spot-2', matchId: 'match-1', playerId: null, status: 'open', position: 1 },
      { id: 'spot-3', matchId: 'match-1', playerId: null, status: 'open', position: 2 },
      { id: 'spot-4', matchId: 'match-1', playerId: null, status: 'open', position: 3 },
    ],
    createdAt: '2026-05-16T12:00:00.000Z',
    ...overrides,
  };
}

describe('MatchList', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders loading state', () => {
    render(<MatchList matches={[]} loading error={null} />);
    expect(screen.getByText(/a procurar jogos/i)).toBeTruthy();
  });

  it('renders error state', () => {
    render(<MatchList matches={[]} loading={false} error="Erro de rede" />);
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText(/erro de rede/i)).toBeTruthy();
  });

  it('renders empty state when no matches', () => {
    render(<MatchList matches={[]} loading={false} error={null} />);
    expect(screen.getByText(/nenhum jogo encontrado/i)).toBeTruthy();
  });

  it('renders badge "N vagas" correct for doubles match with 2 open spots', () => {
    const match = makeMatch({
      format: 'doubles',
      spots: [
        { id: 's1', matchId: 'match-1', playerId: 'u1', status: 'filled', position: 0 },
        { id: 's2', matchId: 'match-1', playerId: 'u2', status: 'filled', position: 1 },
        { id: 's3', matchId: 'match-1', playerId: null, status: 'open', position: 2 },
        { id: 's4', matchId: 'match-1', playerId: null, status: 'open', position: 3 },
      ],
    });
    render(<MatchList matches={[match]} loading={false} error={null} />);
    // Should show "2 vagas"
    expect(screen.getByLabelText(/2 vagas disponíveis de 4/i)).toBeTruthy();
    expect(screen.getByText(/2 vagas/i)).toBeTruthy();
  });

  it('renders "Cheio" badge when all spots are filled', () => {
    const match = makeMatch({
      spots: [
        { id: 's1', matchId: 'match-1', playerId: 'u1', status: 'filled', position: 0 },
        { id: 's2', matchId: 'match-1', playerId: 'u2', status: 'filled', position: 1 },
        { id: 's3', matchId: 'match-1', playerId: 'u3', status: 'filled', position: 2 },
        { id: 's4', matchId: 'match-1', playerId: 'u4', status: 'filled', position: 3 },
      ],
    });
    render(<MatchList matches={[match]} loading={false} error={null} />);
    expect(screen.getByText('Cheio')).toBeTruthy();
  });

  it('renders list of matches', () => {
    const matches = [makeMatch({ id: 'a' }), makeMatch({ id: 'b' })];
    render(<MatchList matches={matches} loading={false} error={null} />);
    expect(screen.getByRole('list', { name: /lista de jogos/i })).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});
