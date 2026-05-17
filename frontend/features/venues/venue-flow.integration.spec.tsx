import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VenueForm } from './venue-form';
import { SlotPublisher } from './slot-publisher';
import type { Court, Venue } from '@/lib/api-types';

// ── Venue form integration ──────────────────────────────────────────────────

const createVenueMock = vi.fn();

vi.mock('@/lib/use-api', () => ({
  useApi: () => ({
    venues: {
      createVenue: createVenueMock,
      publishSlot: vi.fn().mockResolvedValue({
        id: 'slot-1',
        courtId: 'court-1',
        startsAt: '2026-05-17T10:00:00.000Z',
        endsAt: '2026-05-17T11:00:00.000Z',
        status: 'available',
      }),
    },
  }),
}));

vi.mock('@/features/auth/auth-context', () => ({
  useAuth: () => ({ user: { id: 'u1', role: 'venue_manager', email: 'v@test.com' } }),
}));

const courts: Court[] = [{ id: 'court-1', venueId: 'venue-1', name: 'Court 1' }];

describe('Venue flow integration', () => {
  beforeEach(() => {
    cleanup();
    createVenueMock.mockReset();
  });

  it('creates venue and calls onSuccess with the result', async () => {
    const user = userEvent.setup();
    const createdVenue: Venue = {
      id: 'venue-1',
      managerId: 'u1',
      name: 'Arena Beach',
      address: 'Rua X, Lisboa',
    };
    createVenueMock.mockResolvedValue(createdVenue);
    const onSuccess = vi.fn();

    render(<VenueForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText(/nome do clube/i), 'Arena Beach');
    await user.type(screen.getByLabelText(/endereço/i), 'Rua X, Lisboa');
    await user.click(screen.getByRole('button', { name: /criar clube/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(createdVenue));
  });

  it('publishes a slot and calls onPublished', async () => {
    const user = userEvent.setup();
    const onPublished = vi.fn();

    render(<SlotPublisher venueId="venue-1" courts={courts} onPublished={onPublished} />);

    await user.type(screen.getByLabelText(/data e hora de início/i), '2026-05-17T10:00');
    await user.type(screen.getByLabelText(/data e hora de fim/i), '2026-05-17T11:00');
    await user.click(screen.getByRole('button', { name: /publicar horário/i }));

    await waitFor(() => expect(onPublished).toHaveBeenCalled());
  });
});
