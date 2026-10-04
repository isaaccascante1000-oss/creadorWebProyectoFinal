import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { geminiService } from '../geminiService';

describe('geminiService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends the prompt and serialized canvas to the authenticated Gemini proxy', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: '```html\n<section class="p-4">Hola</section>\n```' }] } }],
      }),
    });
    const canvas = JSON.stringify({ schemaVersion: '1.0', objects: [{ type: 'rect' }] });

    const result = await geminiService.generateUIFromPrompt('Genera una tarjeta', canvas);

    expect(fetch.mock.calls[0][0]).toContain('/api/ai/generate');
    expect(fetch.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      prompt: 'Genera una tarjeta',
      canvas,
    });
    expect(result).toEqual({
      success: true,
      data: { jsxCode: '<section class="p-4">Hola</section>' },
      error: null,
    });
  });

  it('surfaces proxy errors instead of returning a success-shaped response', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: 'Gemini no está configurado.' }),
    });

    await expect(geminiService.generateUIFromPrompt('Genera un diseño', '{}')).resolves.toMatchObject({
      success: false,
      data: null,
      error: 'Gemini no está configurado.',
    });
  });

  it('converts object-shaped API errors into readable text', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: { message: 'Gemini está temporalmente fuera de servicio.' } }),
    });

    await expect(geminiService.generateUIFromPrompt('Genera un diseño', '{}')).resolves.toMatchObject({
      success: false,
      error: 'Gemini está temporalmente fuera de servicio.',
    });
  });

  it('rejects an empty Gemini response', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [] }),
    });

    await expect(geminiService.generateUIFromPrompt('Genera un diseño', '{}')).resolves.toMatchObject({
      success: false,
      data: null,
      error: 'Gemini devolvió una respuesta vacía.',
    });
  });
});
