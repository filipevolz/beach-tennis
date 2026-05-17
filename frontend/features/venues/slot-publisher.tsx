'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApi } from '@/lib/use-api';
import type { AvailabilitySlot, Court } from '@/lib/api-types';

interface SlotPublisherProps {
  venueId: string;
  courts: Court[];
  onPublished: (slot: AvailabilitySlot) => void;
}

export function SlotPublisher({ venueId, courts, onPublished }: SlotPublisherProps) {
  const api = useApi();
  const [courtId, setCourtId] = useState(courts[0]?.id ?? '');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [priceCents, setPriceCents] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (endsAt <= startsAt) {
      setError('A hora de fim deve ser posterior à hora de início.');
      return;
    }

    setLoading(true);
    try {
      const slot = await api.venues.publishSlot(venueId, {
        courtId,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        priceCents: priceCents ? Math.round(Number(priceCents) * 100) : undefined,
      });
      onPublished(slot);
      setStartsAt('');
      setEndsAt('');
      setPriceCents('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao publicar horário.');
    } finally {
      setLoading(false);
    }
  }

  if (courts.length === 0) {
    return (
      <p className="page-center">
        Adicione pelo menos um court antes de publicar horários.
      </p>
    );
  }

  return (
    <form
      className="auth-form"
      onSubmit={(e) => void handleSubmit(e)}
      aria-label="Publicar horário"
    >
      <div className="form-field">
        <Label htmlFor="slot-court">Court</Label>
        <select
          id="slot-court"
          value={courtId}
          onChange={(e) => setCourtId(e.target.value)}
          required
          aria-label="Selecionar court"
        >
          {courts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <Label htmlFor="slot-starts">Início</Label>
        <Input
          id="slot-starts"
          type="datetime-local"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          required
          aria-label="Data e hora de início"
        />
      </div>

      <div className="form-field">
        <Label htmlFor="slot-ends">Fim</Label>
        <Input
          id="slot-ends"
          type="datetime-local"
          value={endsAt}
          onChange={(e) => setEndsAt(e.target.value)}
          required
          aria-label="Data e hora de fim"
        />
      </div>

      <div className="form-field">
        <Label htmlFor="slot-price">Preço (€, opcional)</Label>
        <Input
          id="slot-price"
          type="number"
          min="0"
          step="0.01"
          value={priceCents}
          onChange={(e) => setPriceCents(e.target.value)}
          placeholder="Ex: 15.00"
          aria-label="Preço por hora"
        />
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? 'A publicar…' : 'Publicar horário'}
      </Button>
    </form>
  );
}
