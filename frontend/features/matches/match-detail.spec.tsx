import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MatchDetail } from './match-detail';
import type { Match } from '@/lib/api-types';

const joinSpotMock = vi.fn();
const leaveSpotMock = vi.fn();
const getMatchMock = vi.fn();

vi.mock('@/lib/use-api', () => ({
  useApi: () => ({
    matches: {
      joinSpot: joinSpotMock,
      leaveSpot: leaveSpotMock,
      getMatch: getMatchMock,
    },
  }),
}));

vi.mock('@/features/auth/auth-context', () => ({
  useAuth: () => ({ user: { id: 'player-1', role: 'player', email: 'p@test.com' } }),
}));

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 'match-1',
    creatorId: 'player-1',
    format: 'doubles',
    visibility: 'public',
    skillLevel: 'intermediate',
    latitude: 38.7,
    longitude: -9.1,
    status: 'forming',
    spots: [
      { id: 's1', matchId: 'match-1', playerId: null, status: 'open', position: 1 },
      { id: 's2', matchId: 'match-1', playerId: null, status: 'open', position: 2 },
      { id: 's3', matchId: 'match-1', playerId: null, status: 'open', position: 3 },
      { id: 's4', matchId: 'match-1', playerId: null, status: 'open', position: 4 },
    ],
    createdAt: '2026-05-16T12:00:00.000Z',
    ...overrides,
  };
}

describe('MatchDetail', () => {
  beforeEach(() => {
    cleanup();
    joinSpotMock.mockReset();
    leaveSpotMock.mockReset();
    getMatchMock.mockReset();
  });

  it('joins an open spot and refreshes match details', async () => {
    const user = userEvent.setup();
    const updated = makeMatch({
      spots: [
        { id: 's1', matchId: 'match-1', playerId: 'player-1', status: 'filled', position: 1 },
        { id: 's2', matchId: 'match-1', playerId: null, status: 'open', position: 2 },
        { id: 's3', matchId: 'match-1', playerId: null, status: 'open', position: 3 },
        { id: 's4', matchId: 'match-1', playerId: null, status: 'open', position: 4 },
      ],
    });
    joinSpotMock.mockResolvedValue(updated.spots[0]);
    getMatchMock.mockResolvedValue(updated);
    const onMatchUpdated = vi.fn();

    render(<MatchDetail match={makeMatch()} onMatchUpdated={onMatchUpdated} />);

    await user.click(screen.getByRole('button', { name: /juntar-me ao jogo/i }));

    await waitFor(() => expect(joinSpotMock).toHaveBeenCalledWith('match-1'));
    expect(getMatchMock).toHaveBeenCalledWith('match-1');
    expect(onMatchUpdated).toHaveBeenCalledWith(updated);
  });

  it('leaves a joined spot and refreshes match details', async () => {
    const user = userEvent.setup();
    const match = makeMatch({
      spots: [
        { id: 's1', matchId: 'match-1', playerId: 'player-1', status: 'filled', position: 1 },
        { id: 's2', matchId: 'match-1', playerId: null, status: 'open', position: 2 },
      ],
      format: 'singles',
    });
    const updated = makeMatch({
      spots: [
        { id: 's1', matchId: 'match-1', playerId: null, status: 'open', position: 1 },
        { id: 's2', matchId: 'match-1', playerId: null, status: 'open', position: 2 },
      ],
      format: 'singles',
    });
    leaveSpotMock.mockResolvedValue(undefined);
    getMatchMock.mockResolvedValue(updated);
    const onMatchUpdated = vi.fn();

    render(<MatchDetail match={match} onMatchUpdated={onMatchUpdated} />);

    await user.click(screen.getByRole('button', { name: /sair do jogo/i }));

    await waitFor(() => expect(leaveSpotMock).toHaveBeenCalledWith('match-1'));
    expect(onMatchUpdated).toHaveBeenCalledWith(updated);
  });

  it('shows booking CTA for organizer and invite share for invite matches', () => {
    const onBookSlot = vi.fn();
    render(
      <MatchDetail
        match={makeMatch({
          visibility: 'invite',
          inviteCode: 'invite-code-1',
          status: 'ready_to_book',
        })}
        onMatchUpdated={vi.fn()}
        onBookSlot={onBookSlot}
      />,
    );

    expect(screen.getByRole('button', { name: /reservar horário de court/i })).toBeTruthy();
    expect(screen.getByLabelText(/partilhar convite/i)).toBeTruthy();
    expect(screen.getByDisplayValue(/\/matches\/invite\/invite-code-1$/i)).toBeTruthy();
  });
});
