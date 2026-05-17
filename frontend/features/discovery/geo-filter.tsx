'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const DISCOVERY_DEFAULT_RADIUS_KM = 20;

export interface GeoFilterValue {
  lat: number;
  lng: number;
  radiusKm: number;
}

interface GeoFilterProps {
  value: GeoFilterValue | null;
  onChange: (value: GeoFilterValue) => void;
}

export function GeoFilter({ value, onChange }: GeoFilterProps) {
  const [manualLat, setManualLat] = useState(value ? String(value.lat) : '');
  const [manualLng, setManualLng] = useState(value ? String(value.lng) : '');
  const [radiusKm, setRadiusKm] = useState(value ? String(value.radiusKm) : String(DISCOVERY_DEFAULT_RADIUS_KM));
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [mode, setMode] = useState<'geo' | 'manual'>('geo');

  useEffect(() => {
    if (mode !== 'geo') return;

    if (!navigator.geolocation) {
      setGeoError('Geolocalização não disponível neste browser.');
      setMode('manual');
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setManualLat(String(lat));
        setManualLng(String(lng));
        onChange({ lat, lng, radiusKm: Number(radiusKm) || DISCOVERY_DEFAULT_RADIUS_KM });
      },
      () => {
        setGeoLoading(false);
        setGeoError('Localização não concedida. Introduza manualmente.');
        setMode('manual');
        onChange({
          lat: 0,
          lng: 0,
          radiusKm: Number(radiusKm) || DISCOVERY_DEFAULT_RADIUS_KM,
        });
      },
      { timeout: 8000 },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function handleManualApply() {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    const radius = Number(radiusKm) || DISCOVERY_DEFAULT_RADIUS_KM;
    if (!isNaN(lat) && !isNaN(lng)) {
      onChange({ lat, lng, radiusKm: radius });
    }
  }

  return (
    <div className="geo-filter" role="search" aria-label="Filtro de localização">
      <div className="geo-filter__controls">
        {mode === 'geo' && geoLoading && (
          <p className="geo-filter__status" aria-live="polite">A obter localização…</p>
        )}
        {geoError && (
          <p className="form-error" role="alert">{geoError}</p>
        )}

        <div className="geo-filter__radius">
          <Label htmlFor="geo-radius">Raio (km)</Label>
          <Input
            id="geo-radius"
            type="number"
            min="1"
            max="200"
            value={radiusKm}
            onChange={(e) => setRadiusKm(e.target.value)}
            aria-label="Raio de pesquisa em quilómetros"
          />
        </div>

        {mode === 'manual' && (
          <div className="geo-filter__manual">
            <div className="form-field">
              <Label htmlFor="geo-lat">Latitude</Label>
              <Input
                id="geo-lat"
                type="number"
                step="any"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                placeholder="Ex: 38.7169"
                aria-label="Latitude"
              />
            </div>
            <div className="form-field">
              <Label htmlFor="geo-lng">Longitude</Label>
              <Input
                id="geo-lng"
                type="number"
                step="any"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                placeholder="Ex: -9.1399"
                aria-label="Longitude"
              />
            </div>
            <Button variant="secondary" onClick={handleManualApply}>
              Aplicar
            </Button>
          </div>
        )}

        <Button
          variant="secondary"
          onClick={() => {
            setGeoError(null);
            setMode('geo');
          }}
          aria-label="Usar localização actual do browser"
        >
          Perto de mim
        </Button>
      </div>
    </div>
  );
}
