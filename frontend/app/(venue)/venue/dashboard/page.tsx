'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { VenueForm } from '@/features/venues/venue-form';
import { CourtList } from '@/features/venues/court-list';
import { useApi } from '@/lib/use-api';
import type { Venue } from '@/lib/api-types';

export default function VenueDashboardPage() {
  const api = useApi();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.venues
      .getMyVenue()
      .then((v) => {
        if (!cancelled) setVenue(v);
      })
      .catch(() => {
        if (!cancelled) setVenue(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [api.venues]);

  if (loading) {
    return <p className="page-center" aria-live="polite">A carregar…</p>;
  }

  if (!venue && !showCreate) {
    return (
      <section className="page-hero">
        <h1>Área do clube</h1>
        <p>Ainda não tem um perfil de clube criado.</p>
        <Button onClick={() => setShowCreate(true)}>Criar clube</Button>
      </section>
    );
  }

  if (!venue || showCreate) {
    return (
      <section className="page-hero">
        <h1>Criar clube</h1>
        <VenueForm
          onSuccess={(v) => {
            setVenue(v);
            setShowCreate(false);
          }}
        />
      </section>
    );
  }

  return (
    <div className="venue-dashboard">
      <section className="page-hero venue-dashboard__profile">
        <div className="venue-dashboard__header">
          <div>
            <h1>{venue.name}</h1>
            <p className="venue-dashboard__address">{venue.address}</p>
            {venue.description && (
              <p className="venue-dashboard__description">{venue.description}</p>
            )}
          </div>
          <Button variant="secondary" onClick={() => setShowEdit((v) => !v)}>
            {showEdit ? 'Cancelar' : 'Editar perfil'}
          </Button>
        </div>

        {showEdit && (
          <div className="venue-dashboard__edit-form">
            <VenueForm
              venue={venue}
              onSuccess={(v) => {
                setVenue(v);
                setShowEdit(false);
              }}
            />
          </div>
        )}
      </section>

      <section className="page-hero venue-dashboard__courts">
        <CourtList venueId={venue.id} />
      </section>

      <section className="page-hero venue-dashboard__slots-cta">
        <div className="venue-dashboard__slots-header">
          <h2>Horários</h2>
          <Link href="/venue/slots">
            <Button>Gerir horários</Button>
          </Link>
        </div>
        <p>Publique e gira os horários disponíveis para reserva.</p>
      </section>
    </div>
  );
}
