'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApi } from '@/lib/use-api';
import type { Match, MatchFormat, MatchVisibility } from '@/lib/api-types';

interface CreateMatchFormProps {
  defaultLat?: number;
  defaultLng?: number;
  onSuccess: (match: Match) => void;
  onCancel?: () => void;
}

const SKILL_OPTIONS = [
  { value: 'beginner', label: 'Iniciante' },
  { value: 'intermediate', label: 'Intermédio' },
  { value: 'advanced', label: 'Avançado' },
];

export function CreateMatchForm({ defaultLat, defaultLng, onSuccess, onCancel }: CreateMatchFormProps) {
  const api = useApi();
  const [format, setFormat] = useState<MatchFormat>('doubles');
  const [visibility, setVisibility] = useState<MatchVisibility>('public');
  const [skillLevel, setSkillLevel] = useState('intermediate');
  const [lat, setLat] = useState(defaultLat != null ? String(defaultLat) : '');
  const [lng, setLng] = useState(defaultLng != null ? String(defaultLng) : '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    if (isNaN(latitude) || isNaN(longitude)) {
      setError('Introduza coordenadas válidas.');
      return;
    }

    setLoading(true);
    try {
      const match = await api.matches.createMatch({
        format,
        visibility,
        skillLevel,
        latitude,
        longitude,
        notes: notes.trim() || undefined,
      });
      onSuccess(match);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar jogo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="auth-form"
      onSubmit={(e) => void handleSubmit(e)}
      aria-label="Criar jogo"
      noValidate
    >
      <div className="form-field">
        <Label>Formato</Label>
        <div className="role-options">
          {(['singles', 'doubles'] as MatchFormat[]).map((f) => (
            <label key={f} className="role-option">
              <input
                type="radio"
                name="format"
                value={f}
                checked={format === f}
                onChange={() => setFormat(f)}
              />
              {f === 'singles' ? 'Singles (2 jogadores)' : 'Doubles (4 jogadores)'}
            </label>
          ))}
        </div>
      </div>

      <div className="form-field">
        <Label>Visibilidade</Label>
        <div className="role-options">
          <label className="role-option">
            <input
              type="radio"
              name="visibility"
              value="public"
              checked={visibility === 'public'}
              onChange={() => setVisibility('public')}
            />
            Público (aparece na descoberta)
          </label>
          <label className="role-option">
            <input
              type="radio"
              name="visibility"
              value="invite"
              checked={visibility === 'invite'}
              onChange={() => setVisibility('invite')}
            />
            Apenas por convite (link privado)
          </label>
        </div>
        {visibility === 'invite' && (
          <p className="geo-filter__status">
            Este jogo não aparecerá nos resultados de descoberta pública.
          </p>
        )}
      </div>

      <div className="form-field">
        <Label htmlFor="match-skill">Nível de jogo</Label>
        <select
          id="match-skill"
          value={skillLevel}
          onChange={(e) => setSkillLevel(e.target.value)}
          aria-label="Nível de jogo"
        >
          {SKILL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <Label htmlFor="match-lat">Latitude</Label>
        <Input
          id="match-lat"
          type="number"
          step="any"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          required
          placeholder="Ex: 38.7169"
          aria-label="Latitude do jogo"
        />
      </div>

      <div className="form-field">
        <Label htmlFor="match-lng">Longitude</Label>
        <Input
          id="match-lng"
          type="number"
          step="any"
          value={lng}
          onChange={(e) => setLng(e.target.value)}
          required
          placeholder="Ex: -9.1399"
          aria-label="Longitude do jogo"
        />
      </div>

      <div className="form-field">
        <Label htmlFor="match-notes">Notas (opcional)</Label>
        <Input
          id="match-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Informações adicionais sobre o jogo"
        />
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="create-match-form__actions">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? 'A criar…' : 'Criar jogo'}
        </Button>
      </div>
    </form>
  );
}
