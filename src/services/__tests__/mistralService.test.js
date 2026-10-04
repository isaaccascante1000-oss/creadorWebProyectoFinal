import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mistralService } from '../mistralService';

describe('mistralService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('usa el proxy autenticado y limpia el bloque de código devuelto', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '```jsx\n<div>Diseño</div>\n```' } }] }),
    });

    const result = await mistralService.generateUIFromPrompt('Genera una tarjeta', '{}');

    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch.mock.calls[0][0]).toContain('/api/ai/mistral');
    expect(fetch.mock.calls[0][1].credentials).toBe('include');
    expect(result.success).toBe(true);
    expect(result.data.jsxCode).toBe('<div>Diseño</div>');
  });

  it('escapa texto potencialmente ejecutable en el fallback local', async () => {
    fetch.mockRejectedValue(new Error('Backend unavailable'));
    const canvas = JSON.stringify({ objects: [{ type: 'text', text: '<img src=x onerror=alert(1)>' }] });

    const result = await mistralService.generateUIFromPrompt('Prueba', canvas);

    expect(result.data.jsxCode).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(result.data.jsxCode).not.toContain('<img src=x');
  });
});
