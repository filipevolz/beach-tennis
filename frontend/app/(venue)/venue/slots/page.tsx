'use client';

import { useState, useEffect } from 'react';
import { SlotPublisher } from '@/features/venues/slot-publisher';
import { SlotList } from '@/features/venues/slot-list';
import { useApi } from '@/lib/use-api';
import type { AvailabilitySlot, Court, Venue } from '@/lib/api-types';

export default function VenueSlotsPage() {
  const api = useApi();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const v = await api.venues.getMyVenue();
        if (cancelled) return;
        setVenue(v);

        const [cs, ss] = await Promise.all([
          api.venues.listCourts(v.id),
          api.venues.listSlots(),
        ]);
        if (cancelled) return;
        setCourts(cs);
        const courtIds = new Set(cs.map((court) => court.id));
        setSlots(
          ss.filter(
            (slot) =>
              courtIds.has(slot.courtId) ||
              slot.court?.venueId === v.id ||
              slot.venue?.id === v.id,
          ),
        );
      } catch {
        if (!cancelled) setError('Não foi possível carregar os dados do venue.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [api.venues]);

  function handlePublished(slot: AvailabilitySlot) {
    setSlots((prev) => [slot, ...prev]);
  }

  function handleCancelled(slotId: string) {
    setSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, status: 'cancelled' as const } : s)),
    );
  }

  if (loading) return <p className="page-center" aria-live="polite">A carregar…</p>;
  if (error) return <p className="form-error" role="alert">{error}</p>;
  if (!venue) return <p className="page-center">Crie primeiro o perfil do clube.</p>;

  return (
    <div className="slots-page">
      <section className="page-hero">
        <h1>Publicar horário</h1>
        <SlotPublisher
          venueId={venue.id}
          courts={courts}
          onPublished={handlePublished}
        />
      </section>

      <section className="page-hero">
        <h1>Horários publicados</h1>
        <SlotList slots={slots} onSlotCancelled={handleCancelled} />
      </section>
    </div>
  );
}
