'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GeoFilter, DISCOVERY_DEFAULT_RADIUS_KM, type GeoFilterValue } from '@/features/discovery/geo-filter';
import { MatchList } from '@/features/discovery/match-list';
import { useApi } from '@/lib/use-api';
import type { Match, MatchFormat } from '@/lib/api-types';

const FORMAT_OPTIONS: { value: '' | MatchFormat; label: string }[] = [
  { value: '', label: 'Todos os formatos' },
  { value: 'singles', label: 'Singles' },
  { value: 'doubles', label: 'Doubles' },
];

const SKILL_OPTIONS = [
  { value: '', label: 'Todos os níveis' },
  { value: 'beginner', label: 'Iniciante' },
  { value: 'intermediate', label: 'Intermédio' },
  { value: 'advanced', label: 'Avançado' },
];

export default function DiscoverPage() {
  const api = useApi();
  const [geo, setGeo] = useState<GeoFilterValue | null>(null);
  const [format, setFormat] = useState<'' | MatchFormat>('');
  const [skill, setSkill] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchMatches = useCallback(
    async (geoValue: GeoFilterValue | null) => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.matches.listPublicMatches({
          lat: geoValue?.lat,
          lng: geoValue?.lng,
          radiusKm: geoValue?.radiusKm ?? DISCOVERY_DEFAULT_RADIUS_KM,
          format: format || undefined,
          skillLevel: skill || undefined,
        });
        setMatches(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar jogos.');
      } finally {
        setLoading(false);
      }
    },
    [api.matches, format, skill],
  );

  useEffect(() => {
    void fetchMatches(geo);
  }, [fetchMatches, geo]);

  function handleGeoChange(value: GeoFilterValue) {
    setGeo(value);
  }

  return (
    <div className="discover-page">
      <section className="page-hero discover-page__hero">
        <div className="discover-page__title-row">
          <h1>Descobrir jogos</h1>
          <Button onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? 'Fechar' : '+ Criar jogo'}
          </Button>
        </div>

        {showCreate && (
          <div className="discover-page__create-inline">
            <p className="geo-filter__status">
              Para criar um jogo por convite, escolha a opção &ldquo;Apenas por convite&rdquo; no formulário abaixo.
            </p>
            {/* Dynamic import to avoid circular deps — just link to create page */}
            <Link href="/player/matches/create">
              <Button>Abrir formulário de criação →</Button>
            </Link>
          </div>
        )}
      </section>

      <section className="page-hero discover-page__filters">
        <h2>Filtros</h2>
        <GeoFilter value={geo} onChange={handleGeoChange} />

        <div className="discover-page__select-filters">
          <div className="form-field">
            <label className="label" htmlFor="filter-format">Formato</label>
            <select
              id="filter-format"
              value={format}
              onChange={(e) => setFormat(e.target.value as '' | MatchFormat)}
              aria-label="Filtrar por formato"
            >
              {FORMAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="label" htmlFor="filter-skill">Nível</label>
            <select
              id="filter-skill"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              aria-label="Filtrar por nível"
            >
              {SKILL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="page-hero">
        <MatchList matches={matches} loading={loading} error={error} />
      </section>
    </div>
  );
}
