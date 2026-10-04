import { describe, expect, it } from 'vitest';
import { createGeminiGenerateUrl } from './gemini.js';

describe('Gemini proxy URL', () => {
  it('builds a v1beta generateContent URL with the configured model and API key', () => {
    const url = createGeminiGenerateUrl('test-api-key', 'gemini-3.8-flash');

    expect(url.origin).toBe('https://generativelanguage.googleapis.com');
    expect(url.pathname).toBe('/v1beta/models/gemini-3.8-flash:generateContent');
    expect(url.searchParams.get('key')).toBe('test-api-key');
  });

  it('encodes a model identifier before inserting it into the endpoint path', () => {
    const url = createGeminiGenerateUrl('test-api-key', 'model/name');

    expect(url.pathname).toBe('/v1beta/models/model%2Fname:generateContent');
  });
});
