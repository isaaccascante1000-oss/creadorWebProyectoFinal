import { describe, expect, it } from 'vitest';
import { getErrorMessage } from '../errorMessage';

describe('getErrorMessage', () => {
  it('prefers a readable API response error', () => {
    expect(getErrorMessage({
      response: { data: { error: 'No se pudo exportar.' } },
      message: 'Request failed',
    })).toBe('No se pudo exportar.');
  });

  it('extracts text from an object-shaped message', () => {
    expect(getErrorMessage({ message: { message: 'Servicio no disponible.' } }))
      .toBe('Servicio no disponible.');
  });

  it('never returns an object or the string [object Object]', () => {
    expect(getErrorMessage({ error: { status: 503 } })).toBe('Ocurrió un error inesperado.');
  });
});
