'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useApi } from '@/lib/use-api';
import type { AvailabilitySlot } from '@/lib/api-types';

const STATUS_LABEL: Record<string, string> = {
  available: 'Disponível',
  reserved: 'Reservado',
  cancelled: 'Cancelado',
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface SlotListProps {
  slots: AvailabilitySlot[];
  onSlotCancelled: (slotId: string) => void;
}

export function SlotList({ slots, onSlotCancelled }: SlotListProps) {
  const api = useApi();
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel(slotId: string) {
    setError(null);
    setCancelling(slotId);
    try {
      await api.venues.updateSlot(slotId, { status: 'cancelled' });
      onSlotCancelled(slotId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao cancelar horário.');
    } finally {
      setCancelling(null);
    }
  }

  if (slots.length === 0) {
    return <p className="page-center">Ainda não há horários publicados.</p>;
  }

  return (
    <div className="slot-list" aria-label="Lista de horários">
      {error && <p className="form-error" role="alert">{error}</p>}
      <ul className="slot-list__items" role="list">
        {slots.map((slot) => (
          <li key={slot.id} className="slot-list__item">
            <div className="slot-list__info">
              <span className="slot-list__time">
                {formatDateTime(slot.startsAt)} – {formatDateTime(slot.endsAt)}
              </span>
              {slot.court && (
                <span className="slot-list__court">{slot.court.name}</span>
              )}
              {slot.priceCents != null && (
                <span className="slot-list__price">
                  {(slot.priceCents / 100).toFixed(2)} €
                </span>
              )}
            </div>
            <div className="slot-list__status-actions">
              <span
                className={`slot-badge slot-badge--${slot.status}`}
                aria-label={`Estado: ${STATUS_LABEL[slot.status] ?? slot.status}`}
              >
                {STATUS_LABEL[slot.status] ?? slot.status}
              </span>
              {slot.status === 'available' && (
                <Button
                  variant="secondary"
                  disabled={cancelling === slot.id}
                  onClick={() => void handleCancel(slot.id)}
                  aria-label={`Cancelar horário de ${formatDateTime(slot.startsAt)}`}
                >
                  {cancelling === slot.id ? 'A cancelar…' : 'Cancelar'}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
