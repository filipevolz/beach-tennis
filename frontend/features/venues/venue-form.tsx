'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApi } from '@/lib/use-api';
import type { Venue } from '@/lib/api-types';
import type { CreateVenueInput, UpdateVenueInput } from './api';

interface VenueFormProps {
  venue?: Venue;
  onSuccess: (venue: Venue) => void;
}

export function VenueForm({ venue, onSuccess }: VenueFormProps) {
  const api = useApi();
  const [name, setName] = useState(venue?.name ?? '');
  const [address, setAddress] = useState(venue?.address ?? '');
  const [description, setDescription] = useState(venue?.description ?? '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let result: Venue;
      if (venue) {
        const input: UpdateVenueInput = { name, address, description: description || undefined };
        result = await api.venues.updateVenue(venue.id, input);
      } else {
        const input: CreateVenueInput = { name, address, description: description || undefined };
        result = await api.venues.createVenue(input);
      }
      onSuccess(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={(e) => void handleSubmit(e)} aria-label="Formulário de venue">
      <div className="form-field">
        <Label htmlFor="venue-name">Nome do clube</Label>
        <Input
          id="venue-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Ex: Arena Beach Tennis"
          autoComplete="organization"
        />
      </div>

      <div className="form-field">
        <Label htmlFor="venue-address">Endereço</Label>
        <Input
          id="venue-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          placeholder="Rua Exemplo, 123, Lisboa"
        />
      </div>

      <div className="form-field">
        <Label htmlFor="venue-description">Descrição (opcional)</Label>
        <Input
          id="venue-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Informações sobre o clube"
        />
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? 'A guardar…' : venue ? 'Guardar alterações' : 'Criar clube'}
      </Button>
    </form>
  );
}
