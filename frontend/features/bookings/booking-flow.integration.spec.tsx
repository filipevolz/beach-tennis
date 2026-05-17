import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BookingFlow } from './booking-flow';
import type { AvailabilitySlot } from '@/lib/api-types';

const listSlotsMock = vi.fn();
const createBookingMock = vi.fn();
const confirmBookingMock = vi.fn();

vi.mock('@/lib/use-api', () => ({
  useApi: () => ({
    venues: { listSlots: listSlotsMock },
    bookings: {
      createBooking: createBookingMock,
      confirmBooking: confirmBookingMock,
    },
  }),
}));

vi.mock('@/features/auth/auth-context', () => ({
  useAuth: () => ({ user: { id: 'player-1', role: 'player', email: 'p@test.com' } }),
}));

const availableSlot: AvailabilitySlot = {
  id: 'slot-1',
  courtId: 'court-1',
  startsAt: '2026-05-17T10:00:00.000Z',
  endsAt: '2026-05-17T11:00:00.000Z',
  status: 'available',
  priceCents: 1500,
};

describe('BookingFlow integration', () => {
  beforeEach(() => {
    cleanup();
    listSlotsMock.mockReset();
    createBookingMock.mockReset();
    confirmBookingMock.mockReset();
  });

  it('full booking flow: select slot → create → confirm → UI shows booked', async () => {
    const user = userEvent.setup();
    listSlotsMock.mockResolvedValue([availableSlot]);
    const pending = { id: 'booking-1', matchId: 'match-1', availabilitySlotId: 'slot-1', status: 'pending' as const, createdById: 'player-1' };
    const confirmed = { ...pending, status: 'confirmed' as const };
    createBookingMock.mockResolvedValue(pending);
    confirmBookingMock.mockResolvedValue(confirmed);
    const onBooked = vi.fn();

    render(<BookingFlow matchId="match-1" onBooked={onBooked} onCancel={vi.fn()} />);

    await waitFor(() => screen.getByRole('radio'));
    await user.click(screen.getByRole('radio'));

    const confirmBtn = screen.getByRole('button', { name: /confirmar reserva/i });
    expect(confirmBtn).not.toBeDisabled();
    await user.click(confirmBtn);

    await waitFor(() => screen.getByText(/reserva pendente criada/i));

    await user.click(screen.getByRole('button', { name: /confirmar$/i }));

    await waitFor(() => expect(onBooked).toHaveBeenCalledWith(confirmed));
  });

  it('409 slot not available shows error without crashing', async () => {
    const user = userEvent.setup();
    listSlotsMock.mockResolvedValue([availableSlot]);
    createBookingMock.mockRejectedValue(new Error('409: SLOT_NOT_AVAILABLE'));

    render(<BookingFlow matchId="match-1" onBooked={vi.fn()} onCancel={vi.fn()} />);

    await waitFor(() => screen.getByRole('radio'));
    await user.click(screen.getByRole('radio'));
    await user.click(screen.getByRole('button', { name: /confirmar reserva/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy();
      expect(screen.queryByText(/a processar/i)).toBeNull(); // not crashed/frozen
    });
  });

  it('cancel button calls onCancel', async () => {
    listSlotsMock.mockResolvedValue([]);
    const onCancel = vi.fn();
    render(<BookingFlow matchId="match-1" onBooked={vi.fn()} onCancel={onCancel} />);

    await waitFor(() => screen.getByRole('button', { name: /cancelar/i }));
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
