import { describe, expect, it } from 'vitest';
import { parseApiError } from './api-errors';

describe('parseApiError', () => {
  it('extracts code and message from API body', () => {
    const error = parseApiError({
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
    });

    expect(error.code).toBe('INVALID_CREDENTIALS');
    expect(error.message).toBe('Invalid email or password');
  });

  it('falls back when body is malformed', () => {
    const error = parseApiError(null, 'Falha na rede');
    expect(error.code).toBe('UNKNOWN_ERROR');
    expect(error.message).toBe('Falha na rede');
  });
});
