import { describe, expect, it, vi } from 'vitest';
import { serializeCanvasForAI } from '../canvasSerialization';

describe('serializeCanvasForAI', () => {
  it('serializes canvas dimensions, styles, text, and nested template objects', () => {
    const canvas = {
      getWidth: () => 800,
      getHeight: () => 600,
      toJSON: vi.fn(() => ({
        background: '#0f172a',
        objects: [{
          type: 'group',
          left: 50,
          top: 20,
          width: 300,
          height: 80,
          canvasaiTemplate: 'header',
          objects: [{
            type: 'i-text',
            left: 12,
            top: 8,
            width: 100,
            height: 20,
            fill: '#ffffff',
            stroke: '#111111',
            strokeWidth: 2,
            opacity: 0.8,
            text: 'CanvasAI',
            fontFamily: 'Inter',
            fontSize: 18,
            fontWeight: 'bold',
            textAlign: 'center',
          }],
        }],
      })),
    };

    const result = serializeCanvasForAI(canvas);

    expect(canvas.toJSON).toHaveBeenCalledWith(['canvasaiTemplate']);
    expect(result).toMatchObject({
      schemaVersion: '1.0',
      canvas: { width: 800, height: 600, background: '#0f172a' },
      objects: [{
        template: 'header',
        position: { x: 50, y: 20 },
        children: [{
          content: {
            text: 'CanvasAI',
            fontFamily: 'Inter',
            fontSize: 18,
            fontWeight: 'bold',
            textAlign: 'center',
          },
          style: {
            fill: '#ffffff',
            stroke: '#111111',
            strokeWidth: 2,
            opacity: 0.8,
          },
        }],
      }],
    });
  });

  it('returns a structured empty canvas when Fabric is not initialized', () => {
    expect(serializeCanvasForAI(null)).toEqual({
      schemaVersion: '1.0',
      canvas: { width: 0, height: 0, background: null },
      objects: [],
    });
  });
});
