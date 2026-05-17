'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useApi } from '@/lib/use-api';
import type { AvailabilitySlot, Booking } from '@/lib/api-types';

interface BookingFlowProps {
  matchId: string;
  onBooked: (booking: Booking) => void;
  onCancel: () => void;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function BookingFlow({ matchId, onBooked, onCancel }: BookingFlowProps) {
  const api = useApi();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [pendingBooking, setPendingBooking] = useState<Booking | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.venues
      .listSlots({ status: 'available' })
      .then((data) => {
        if (!cancelled) setSlots(data);
      })
      .catch(() => {
        if (!cancelled) setSlotsError('Não foi possível carregar os horários disponíveis.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [api.venues]);

  const selectedSlot = slots.find((s) => s.id === selectedSlotId);
  const isSelectedReserved = selectedSlot?.status === 'reserved';

  async function handleCreate() {
    if (!selectedSlotId) return;
    setError(null);
    setConfirming(true);
    try {
      const booking = await api.bookings.createBooking({
        matchId,
        availabilitySlotId: selectedSlotId,
      });
      setPendingBooking(booking);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar reserva.';
      if (msg.includes('SLOT_NOT_AVAILABLE') || msg.includes('409')) {
        setError(`Horário indisponível (SLOT_NOT_AVAILABLE). Por favor escolha outro.`);
      } else {
        setError(msg);
      }
    } finally {
      setConfirming(false);
    }
  }

  async function handleConfirm() {
    if (!pendingBooking) return;
    setError(null);
    setConfirming(true);
    try {
      const confirmed = await api.bookings.confirmBooking(pendingBooking.id);
      onBooked(confirmed);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao confirmar reserva.');
    } finally {
      setConfirming(false);
    }
  }

  if (loading) {
    return <p className="page-center" aria-live="polite">A carregar horários disponíveis…</p>;
  }

  if (slotsError) {
    return <p className="form-error" role="alert">{slotsError}</p>;
  }

  return (
    <div className="booking-flow" aria-label="Reservar horário de court">
      <div className="booking-flow__header">
        <h2>Reservar horário de court</h2>
        <p className="booking-flow__info">
          Selecione um horário disponível para o seu jogo. Esta acção é diferente de juntar-se ao jogo.
        </p>
      </div>

      {!pendingBooking ? (
        <>
          {slots.length === 0 ? (
            <p className="page-center">Não há horários disponíveis no momento.</p>
          ) : (
            <ul className="slot-select-list" role="listbox" aria-label="Horários disponíveis">
              {slots.map((slot) => (
                <li key={slot.id} role="option" aria-selected={selectedSlotId === slot.id}>
                  <label
                    className={`slot-select-item${selectedSlotId === slot.id ? ' slot-select-item--selected' : ''}${slot.status === 'reserved' ? ' slot-select-item--reserved' : ''}`}
                  >
                    <input
                      type="radio"
                      name="slot"
                      value={slot.id}
                      checked={selectedSlotId === slot.id}
                      onChange={() => setSelectedSlotId(slot.id)}
                      disabled={slot.status === 'reserved'}
                      aria-label={`Horário de ${formatDateTime(slot.startsAt)} a ${formatDateTime(slot.endsAt)}${slot.status === 'reserved' ? ' — indisponível' : ''}`}
                    />
                    <span className="slot-select-item__time">
                      {formatDateTime(slot.startsAt)} – {formatDateTime(slot.endsAt)}
                    </span>
                    {slot.court && (
                      <span className="slot-select-item__court">{slot.court.name}</span>
                    )}
                    {slot.venue && (
                      <span className="slot-select-item__venue">{slot.venue.name}</span>
                    )}
                    {slot.priceCents != null && (
                      <span className="slot-select-item__price">{(slot.priceCents / 100).toFixed(2)} €</span>
                    )}
                    {slot.status === 'reserved' && (
                      <span className="slot-badge slot-badge--reserved">Reservado</span>
                    )}
                  </label>
                </li>
              ))}
            </ul>
          )}

          {error && <p className="form-error" role="alert">{error}</p>}

          <div className="booking-flow__actions">
            <Button variant="secondary" onClick={onCancel}>
              Cancelar
            </Button>
            <Button
              onClick={() => void handleCreate()}
              disabled={!selectedSlotId || isSelectedReserved || confirming}
              aria-label="Confirmar reserva"
            >
              {confirming ? 'A processar…' : 'Confirmar reserva'}
            </Button>
          </div>
        </>
      ) : (
        <div className="booking-flow__confirm">
          <p className="booking-flow__confirm-msg">
            Reserva pendente criada. Confirme para bloquear o horário.
          </p>
          {selectedSlot && (
            <div className="booking-flow__slot-summary">
              <strong>{formatDateTime(selectedSlot.startsAt)} – {formatDateTime(selectedSlot.endsAt)}</strong>
              {selectedSlot.court && <span> · {selectedSlot.court.name}</span>}
            </div>
          )}

          {error && <p className="form-error" role="alert">{error}</p>}

          <div className="booking-flow__actions">
            <Button variant="secondary" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={() => void handleConfirm()} disabled={confirming}>
              {confirming ? 'A confirmar…' : 'Confirmar'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
