import { describe, expect, it } from 'vitest';
import { parseApiErrorResponse } from './api-errors';

describe('parseApiErrorResponse', () => {
  it('parses JSON error bodies from failed responses', async () => {
    const response = new Response(
      JSON.stringify({ code: 'SLOT_NOT_AVAILABLE', message: 'Slot taken' }),
      { status: 409 },
    );

    const error = await parseApiErrorResponse(response);
    expect(error.code).toBe('SLOT_NOT_AVAILABLE');
    expect(error.message).toBe('Slot taken');
  });

  it('falls back when response body is not JSON', async () => {
    const response = new Response('not-json', { status: 500 });
    const error = await parseApiErrorResponse(response, 'Erro de servidor');
    expect(error.code).toBe('UNKNOWN_ERROR');
    expect(error.message).toBe('Erro de servidor');
  });
});
