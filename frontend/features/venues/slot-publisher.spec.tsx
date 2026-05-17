import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SlotPublisher } from './slot-publisher';
import type { Court } from '@/lib/api-types';

const publishSlotMock = vi.fn();

vi.mock('@/lib/use-api', () => ({
  useApi: () => ({
    venues: { publishSlot: publishSlotMock },
  }),
}));

vi.mock('@/features/auth/auth-context', () => ({
  useAuth: () => ({ user: { id: 'u1', role: 'venue_manager', email: 'v@test.com' } }),
}));

const courts: Court[] = [
  { id: 'court-1', venueId: 'venue-1', name: 'Court 1' },
];

describe('SlotPublisher', () => {
  beforeEach(() => {
    cleanup();
    publishSlotMock.mockReset();
  });

  it('shows message when no courts exist', () => {
    render(<SlotPublisher venueId="venue-1" courts={[]} onPublished={vi.fn()} />);
    expect(screen.getByText(/adicione pelo menos um court/i)).toBeTruthy();
  });

  it('validates endsAt must be after startsAt', async () => {
    const user = userEvent.setup();
    render(<SlotPublisher venueId="venue-1" courts={courts} onPublished={vi.fn()} />);

    const startsAtInput = screen.getByLabelText(/data e hora de início/i);
    const endsAtInput = screen.getByLabelText(/data e hora de fim/i);

    await user.type(startsAtInput, '2026-05-17T12:00');
    await user.type(endsAtInput, '2026-05-17T11:00'); // before start

    await user.click(screen.getByRole('button', { name: /publicar horário/i }));

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText(/hora de fim deve ser posterior/i)).toBeTruthy();
    expect(publishSlotMock).not.toHaveBeenCalled();
  });

  it('calls publishSlot with correct data when form is valid', async () => {
    const user = userEvent.setup();
    const onPublished = vi.fn();
    publishSlotMock.mockResolvedValue({
      id: 'slot-new',
      courtId: 'court-1',
      startsAt: '2026-05-17T10:00:00.000Z',
      endsAt: '2026-05-17T11:00:00.000Z',
      status: 'available',
    });

    render(<SlotPublisher venueId="venue-1" courts={courts} onPublished={onPublished} />);

    await user.type(screen.getByLabelText(/data e hora de início/i), '2026-05-17T10:00');
    await user.type(screen.getByLabelText(/data e hora de fim/i), '2026-05-17T11:00');
    await user.click(screen.getByRole('button', { name: /publicar horário/i }));

    expect(publishSlotMock).toHaveBeenCalledWith(
      'venue-1',
      expect.objectContaining({ courtId: 'court-1' }),
    );
    expect(onPublished).toHaveBeenCalled();
  });
});
