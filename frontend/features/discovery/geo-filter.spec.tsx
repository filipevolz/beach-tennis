import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GeoFilter, DISCOVERY_DEFAULT_RADIUS_KM } from './geo-filter';

describe('GeoFilter', () => {
  beforeEach(() => {
    cleanup();
  });

  it('uses DISCOVERY_DEFAULT_RADIUS_KM when user does not grant geolocation', async () => {
    const onChange = vi.fn();

    // Mock geolocation to deny
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: (_success: unknown, error: (err: { code: number }) => void) => {
          setTimeout(() => error({ code: 1 }), 0); // PERMISSION_DENIED
        },
      },
      writable: true,
    });

    render(<GeoFilter value={null} onChange={onChange} />);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ radiusKm: DISCOVERY_DEFAULT_RADIUS_KM }),
      );
    });
  });

  it('shows manual input fields when geo is denied', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: (_: unknown, error: (err: { code: number }) => void) => {
          setTimeout(() => error({ code: 1 }), 0);
        },
      },
      writable: true,
    });

    render(<GeoFilter value={null} onChange={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/^latitude$/i)).toBeTruthy();
      expect(screen.getByLabelText(/^longitude$/i)).toBeTruthy();
    });
  });

  it('renders with initial value', () => {
    render(
      <GeoFilter
        value={{ lat: 38.7, lng: -9.1, radiusKm: 10 }}
        onChange={vi.fn()}
      />,
    );
    const radiusInput = screen.getByLabelText(/raio de pesquisa/i) as HTMLInputElement;
    expect(radiusInput.value).toBe('10');
  });

  it('has "Perto de mim" button', () => {
    render(<GeoFilter value={null} onChange={vi.fn()} />);
    expect(
      screen.getByRole('button', {
        name: /usar localização actual do browser|perto de mim/i,
      }),
    ).toBeTruthy();
  });

  it('uses browser geolocation when granted', async () => {
    const onChange = vi.fn();

    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: (success: (pos: { coords: { latitude: number; longitude: number } }) => void) => {
          setTimeout(() => success({ coords: { latitude: 38.72, longitude: -9.14 } }), 0);
        },
      },
      writable: true,
    });

    render(<GeoFilter value={null} onChange={onChange} />);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ lat: 38.72, lng: -9.14 }),
      );
    });
  });
});
