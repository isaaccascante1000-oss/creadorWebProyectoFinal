const API_URL = import.meta.env.VITE_AUTH_API_URL || `${window.location.protocol}//${window.location.hostname}:3001`;

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

const localFallbackParse = (canvasJSON) => {
  try {
    const objects = JSON.parse(canvasJSON).objects || [];
    if (!objects.length) return '<div class="flex items-center justify-center h-full text-slate-500">Lienzo vacío</div>';
    const elements = objects.map((object) => {
      const left = Math.round(object.left || 0);
      const top = Math.round(object.top || 0);
      const width = Math.round((object.width || 0) * (object.scaleX || 1));
      const height = Math.round((object.height || 0) * (object.scaleY || 1));
      const style = `position:absolute;left:${left}px;top:${top}px;width:${width}px;height:${height}px;opacity:${Number(object.opacity ?? 1)}`;
      if (object.type === 'rect' || object.type === 'circle') {
        const radius = object.type === 'circle' ? '50%' : `${Math.max(0, Number(object.rx) || 0)}px`;
        return `<div style="${style};background-color:${escapeHtml(object.fill || 'transparent')};border-radius:${radius}"></div>`;
      }
      if (['i-text', 'textbox', 'text'].includes(object.type)) {
        return `<div style="${style};color:${escapeHtml(object.fill || '#ffffff')};font-size:${Math.max(1, Number(object.fontSize) || 16)}px">${escapeHtml(object.text || '')}</div>`;
      }
      return '';
    }).join('\n');
    return `<div style="position:relative;width:100%;height:100%;overflow:hidden">${elements}</div>`;
  } catch {
    return '<div class="text-red-500">Error en el parseo local del lienzo.</div>';
  }
};

export const mistralService = {
  async generateUIFromPrompt(promptText, canvasJSON = '{}') {
    try {
      const response = await fetch(`${API_URL}/api/ai/mistral`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt: promptText, canvas: canvasJSON }),
        signal: AbortSignal.timeout(45_000),
      });
      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(responseData.error || `Mistral rechazó la solicitud (${response.status}).`);
      const content = responseData.choices?.[0]?.message?.content;
      if (!content) throw new Error('Mistral devolvió una respuesta vacía.');
      const jsxCode = content.replace(/^```(?:jsx|javascript|html)?\s*/i, '').replace(/\s*```$/, '').trim();
      return { success: true, data: { jsxCode }, error: null };
    } catch {
      return {
        success: true,
        data: { jsxCode: localFallbackParse(canvasJSON) },
        error: null,
      };
    }
  },
};
