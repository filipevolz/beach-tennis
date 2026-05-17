'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApi } from '@/lib/use-api';
import type { Court } from '@/lib/api-types';

interface CourtListProps {
  venueId: string;
}

export function CourtList({ venueId }: CourtListProps) {
  const api = useApi();
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [surface, setSurface] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.resolve(api.venues.listCourts(venueId))
      .then((data) => {
        if (!cancelled) setCourts(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível carregar os courts.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [api.venues, venueId]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setAddError(null);
    setAdding(true);
    try {
      const court = await api.venues.addCourt(venueId, {
        name,
        surface: surface || undefined,
      });
      setCourts((prev) => [...prev, court]);
      setName('');
      setSurface('');
      setShowAdd(false);
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Erro ao adicionar court.');
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <p className="page-center">A carregar courts…</p>;
  if (error) return <p className="form-error" role="alert">{error}</p>;

  return (
    <div className="court-list">
      <div className="section-header">
        <h2>Courts</h2>
        <Button variant="secondary" onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? 'Cancelar' : '+ Adicionar court'}
        </Button>
      </div>

      {showAdd && (
        <form className="auth-form court-add-form" onSubmit={(e) => void handleAdd(e)} aria-label="Adicionar court">
          <div className="form-field">
            <Label htmlFor="court-name">Nome do court</Label>
            <Input
              id="court-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Court 1"
            />
          </div>
          <div className="form-field">
            <Label htmlFor="court-surface">Piso (opcional)</Label>
            <Input
              id="court-surface"
              value={surface}
              onChange={(e) => setSurface(e.target.value)}
              placeholder="Ex: Areia"
            />
          </div>
          {addError && <p className="form-error" role="alert">{addError}</p>}
          <Button type="submit" disabled={adding}>
            {adding ? 'A adicionar…' : 'Adicionar'}
          </Button>
        </form>
      )}

      {courts.length === 0 ? (
        <p className="page-center">Ainda não há courts. Adicione o primeiro.</p>
      ) : (
        <ul className="court-list__items" role="list">
          {courts.map((court) => (
            <li key={court.id} className="court-list__item">
              <span className="court-list__name">{court.name}</span>
              {court.surface && (
                <span className="court-list__surface">{court.surface}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
