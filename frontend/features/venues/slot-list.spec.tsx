import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SlotList } from './slot-list';
import type { AvailabilitySlot } from '@/lib/api-types';

const updateSlotMock = vi.fn();

vi.mock('@/lib/use-api', () => ({
  useApi: () => ({
    venues: {
      updateSlot: (...args: Parameters<typeof updateSlotMock>) => updateSlotMock(...args),
    },
  }),
}));

function makeSlot(overrides: Partial<AvailabilitySlot> = {}): AvailabilitySlot {
  return {
    id: 'slot-1',
    courtId: 'court-1',
    startsAt: '2026-05-17T10:00:00.000Z',
    endsAt: '2026-05-17T11:00:00.000Z',
    status: 'available',
    priceCents: 1800,
    court: {
      id: 'court-1',
      venueId: 'venue-1',
      name: 'Court Central',
    },
    ...overrides,
  };
}

describe('SlotList', () => {
  beforeEach(() => {
    cleanup();
    updateSlotMock.mockReset();
  });

  it('renders slot details and status badge', () => {
    render(<SlotList slots={[makeSlot()]} onSlotCancelled={vi.fn()} />);

    expect(screen.getByText(/court central/i)).toBeTruthy();
    expect(screen.getByText(/18\.00 €/i)).toBeTruthy();
    expect(screen.getByLabelText(/estado: disponível/i)).toBeTruthy();
  });

  it('cancels an available slot', async () => {
    const user = userEvent.setup();
    updateSlotMock.mockResolvedValue({ ...makeSlot(), status: 'cancelled' });
    const onSlotCancelled = vi.fn();

    render(<SlotList slots={[makeSlot()]} onSlotCancelled={onSlotCancelled} />);

    await user.click(screen.getByRole('button', { name: /cancelar horário/i }));

    await waitFor(() => expect(updateSlotMock).toHaveBeenCalledWith('slot-1', { status: 'cancelled' }));
    expect(onSlotCancelled).toHaveBeenCalledWith('slot-1');
  });

  it('does not render cancel action for reserved slots', () => {
    render(
      <SlotList
        slots={[makeSlot({ id: 'slot-2', status: 'reserved' })]}
        onSlotCancelled={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: /cancelar horário/i })).toBeNull();
    expect(screen.getByLabelText(/estado: reservado/i)).toBeTruthy();
  });
});
