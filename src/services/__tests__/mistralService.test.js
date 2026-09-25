import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mistralService } from '../mistralService';

describe('mistralService', () => {
  const originalEnv = import.meta.env;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('debe devolver código de fallback local cuando no hay API Key', async () => {
    vi.stubEnv('VITE_MISTRAL_API_KEY', '');

    const fakeCanvasJSON = JSON.stringify({
      objects: [
        { type: 'rect', left: 10, top: 10, width: 100, height: 100, fill: '#ff0000' }
      ]
    });

    const result = await mistralService.generateUIFromPrompt('Prueba', fakeCanvasJSON);
    
    expect(result.success).toBe(true);
    expect(result.data.jsxCode).toContain('<div className="relative w-full h-full');
    expect(result.data.jsxCode).toContain("backgroundColor: '#ff0000'");
  });

  it('debe manejar la llamada exitosa a la API de Mistral', async () => {
    vi.stubEnv('VITE_MISTRAL_API_KEY', 'fake-key');

    const fakeResponse = {
      ok: true,
      json: async () => ({
        choices: [
          { message: { content: '```jsx\n<div>Generado por Mistral</div>\n```' } }
        ]
      })
    };
    
    global.fetch = vi.fn().mockResolvedValue(fakeResponse);

    const result = await mistralService.generateUIFromPrompt('Prompt test', '{}');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    // Debe limpiar los backticks markdown
    expect(result.data.jsxCode).toBe('<div>Generado por Mistral</div>');
  });

  it('debe usar el fallback local si la API de Mistral falla (fetch error)', async () => {
    vi.stubEnv('VITE_MISTRAL_API_KEY', 'fake-key');

    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const fakeCanvasJSON = JSON.stringify({
      objects: [
        { type: 'circle', left: 20, top: 20, width: 50, height: 50, fill: '#00ff00' }
      ]
    });

    const result = await mistralService.generateUIFromPrompt('Prompt test', fakeCanvasJSON);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.data.jsxCode).toContain("backgroundColor: '#00ff00'");
  });
});
