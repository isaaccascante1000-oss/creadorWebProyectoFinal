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

  it('sends UI prompts to the chat webhook with the expected action and payload', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ output: ' \n```html\n<section class="p-4">Diseño</section>\n``` \n' }),
    });

    const result = await n8nService.triggerWorkflow({ prompt: 'Crea una tarjeta' });

    expect(fetch.mock.calls[0][0]).toContain('/api/n8n/chat');
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      action: 'chat',
      prompt: 'Crea una tarjeta',
    });
    expect(result).toEqual({
      success: true,
      data: { jsxCode: '<section class="p-4">Diseño</section>' },
      error: null,
    });
  });

  it.each(['html', 'jsx', 'xml', ''])('removes %s Markdown fences before returning generated code', async (language) => {
    const fenceMarker = String.fromCharCode(96).repeat(3);
    const fence = language ? `${fenceMarker}${language}` : fenceMarker;
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ output: ` \n${fence}\n<section>Diseño</section>\n${fenceMarker} \n` }),
    });

    const result = await n8nService.triggerWorkflow({ prompt: 'Crea una sección' });

    expect(result.data.jsxCode).toBe('<section>Diseño</section>');
  });
});
