import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MatchDetail } from './match-detail';
import type { Match } from '@/lib/api-types';

const joinSpotMock = vi.fn();
const getMatchMock = vi.fn();

vi.mock('@/lib/use-api', () => ({
  useApi: () => ({
    matches: {
      joinSpot: joinSpotMock,
      leaveSpot: vi.fn(),
      getMatch: getMatchMock,
    },
  }),
}));

vi.mock('@/features/auth/auth-context', () => ({
  useAuth: () => ({ user: { id: 'player-2', role: 'player', email: 'p@test.com' } }),
}));

function makePublicMatch(): Match {
  return {
    id: 'match-public',
    creatorId: 'player-1',
    format: 'doubles',
    visibility: 'public',
    skillLevel: 'intermediate',
    latitude: 38.7,
    longitude: -9.1,
    status: 'forming',
    notes: null,
    spots: [
      { id: 's1', matchId: 'match-public', playerId: 'player-1', status: 'filled', position: 0 },
      { id: 's2', matchId: 'match-public', playerId: null, status: 'open', position: 1 },
      { id: 's3', matchId: 'match-public', playerId: null, status: 'open', position: 2 },
      { id: 's4', matchId: 'match-public', playerId: null, status: 'open', position: 3 },
    ],
    createdAt: '2026-05-16T12:00:00.000Z',
  };
}

describe('Match flow integration', () => {
  beforeEach(() => {
    cleanup();
    joinSpotMock.mockReset();
    getMatchMock.mockReset();
  });

  it('player joins spot and UI updates after join', async () => {
    const user = userEvent.setup();
    const matchAfterJoin: Match = {
      ...makePublicMatch(),
      spots: [
        { id: 's1', matchId: 'match-public', playerId: 'player-1', status: 'filled', position: 0 },
        { id: 's2', matchId: 'match-public', playerId: 'player-2', status: 'filled', position: 1 },
        { id: 's3', matchId: 'match-public', playerId: null, status: 'open', position: 2 },
        { id: 's4', matchId: 'match-public', playerId: null, status: 'open', position: 3 },
      ],
    };

    joinSpotMock.mockResolvedValue({ id: 's2', matchId: 'match-public', playerId: 'player-2', status: 'filled', position: 1 });
    getMatchMock.mockResolvedValue(matchAfterJoin);

    const onMatchUpdated = vi.fn();
    render(<MatchDetail match={makePublicMatch()} onMatchUpdated={onMatchUpdated} />);

    await user.click(screen.getByRole('button', { name: /juntar-me ao jogo/i }));

    await waitFor(() => expect(onMatchUpdated).toHaveBeenCalledWith(matchAfterJoin));
  });

  it('shows error when joining fails', async () => {
    const user = userEvent.setup();
    joinSpotMock.mockRejectedValue(new Error('MATCH_FULL'));

    render(<MatchDetail match={makePublicMatch()} onMatchUpdated={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /juntar-me ao jogo/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy();
      expect(screen.getByText(/MATCH_FULL/i)).toBeTruthy();
    });
  });
});
