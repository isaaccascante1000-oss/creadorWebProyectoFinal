import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { n8nService } from '../n8nService';

describe('n8nService project export', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts the project code, canvas state, and metadata to the export proxy', async () => {
    const canvasData = { schemaVersion: '1.0', objects: [{ type: 'rect' }] };
    const metadata = { objectCount: 1, exportedAt: '2026-10-04T00:00:00.000Z' };

    await n8nService.sendProjectExportWebhook({
      id: 'canvasai-project-1',
      title: 'Diseño',
      prompt: 'Genera una tarjeta',
      code: '<section>Hola</section>',
      canvasData,
      metadata,
    });

    expect(fetch.mock.calls[0][0]).toContain('/api/n8n/project-export');
    expect(fetch.mock.calls[0][1].credentials).toBe('include');
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      prompt: 'Genera una tarjeta',
      canvasData,
      project: {
        id: 'canvasai-project-1',
        title: 'Diseño',
        prompt: 'Genera una tarjeta',
        code: '<section>Hola</section>',
        format: 'HTML',
        metadata,
      },
    });
  });

  it('returns a readable message when the export API error is an object', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ error: { message: 'El webhook no está disponible.' } }),
    });

    await expect(n8nService.sendProjectExportWebhook()).resolves.toMatchObject({
      success: false,
      error: 'El webhook no está disponible.',
    });
  });
});
