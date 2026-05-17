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
  useAuth: () => ({ user: { id: 'u1', role: 'player', email: 'p@test.com' } }),
}));

function makeSlot(overrides: Partial<AvailabilitySlot> = {}): AvailabilitySlot {
  return {
    id: 'slot-1',
    courtId: 'court-1',
    startsAt: '2026-05-17T10:00:00.000Z',
    endsAt: '2026-05-17T11:00:00.000Z',
    status: 'available',
    priceCents: 1500,
    ...overrides,
  };
}

describe('BookingFlow', () => {
  beforeEach(() => {
    cleanup();
    listSlotsMock.mockReset();
    createBookingMock.mockReset();
    confirmBookingMock.mockReset();
  });

  it('disables Confirmar button when selected slot has status "reserved"', async () => {
    const reservedSlot = makeSlot({ id: 'slot-reserved', status: 'reserved' });
    const availableSlot = makeSlot({ id: 'slot-available', status: 'available' });
    listSlotsMock.mockResolvedValue([reservedSlot, availableSlot]);

    render(<BookingFlow matchId="match-1" onBooked={vi.fn()} onCancel={vi.fn()} />);

    await waitFor(() => {
      expect(screen.queryByText(/a carregar/i)).toBeNull();
    });

    const radios = screen.getAllByRole('radio');
    // Select the reserved slot (first radio)
    await userEvent.click(radios[0]);

    const confirmBtn = screen.getByRole('button', { name: /confirmar reserva/i });
    expect(confirmBtn).toBeDisabled();
  });

  it('renders empty state when no slots available', async () => {
    listSlotsMock.mockResolvedValue([]);
    render(<BookingFlow matchId="match-1" onBooked={vi.fn()} onCancel={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/não há horários disponíveis/i)).toBeTruthy();
    });
  });

  it('shows error with SLOT_NOT_AVAILABLE code when booking fails with 409', async () => {
    const slot = makeSlot();
    listSlotsMock.mockResolvedValue([slot]);
    createBookingMock.mockRejectedValue(new Error('SLOT_NOT_AVAILABLE'));

    render(<BookingFlow matchId="match-1" onBooked={vi.fn()} onCancel={vi.fn()} />);

    await waitFor(() => screen.getByRole('radio'));

    await userEvent.click(screen.getByRole('radio'));
    await userEvent.click(screen.getByRole('button', { name: /confirmar reserva/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy();
      expect(screen.getByText(/SLOT_NOT_AVAILABLE/)).toBeTruthy();
    });
  });

  it('calls onBooked after successful booking and confirm', async () => {
    const slot = makeSlot();
    listSlotsMock.mockResolvedValue([slot]);
    const pendingBooking = { id: 'booking-1', matchId: 'match-1', availabilitySlotId: 'slot-1', status: 'pending' as const, createdById: 'u1' };
    const confirmedBooking = { ...pendingBooking, status: 'confirmed' as const };
    createBookingMock.mockResolvedValue(pendingBooking);
    confirmBookingMock.mockResolvedValue(confirmedBooking);

    const onBooked = vi.fn();
    render(<BookingFlow matchId="match-1" onBooked={onBooked} onCancel={vi.fn()} />);

    await waitFor(() => screen.getByRole('radio'));
    await userEvent.click(screen.getByRole('radio'));
    await userEvent.click(screen.getByRole('button', { name: /confirmar reserva/i }));

    await waitFor(() => screen.getByText(/reserva pendente criada/i));

    await userEvent.click(screen.getByRole('button', { name: /confirmar$/i }));

    await waitFor(() => expect(onBooked).toHaveBeenCalledWith(confirmedBooking));
  });
});
