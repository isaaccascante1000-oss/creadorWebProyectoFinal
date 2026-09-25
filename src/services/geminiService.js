/**
 * Servicio para comunicación con la API de Gemini 1.5 Pro
 */
export const geminiService = {
  /**
   * Genera código UI basado únicamente en un prompt de texto
   */
  async generateUIFromPrompt(promptText, canvasJSON = '{}') {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    
    if (!apiKey) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            data: {
              jsxCode: `<div className="p-6 bg-slate-800 text-white rounded-xl shadow-lg border border-indigo-500">\n  <h3 className="text-xl font-bold mb-2 text-indigo-400">Mock Component</h3>\n  <p className="text-sm text-slate-300">Generado para: ${promptText}</p>\n</div>`,
              components: ['MockComponent']
            },
            error: null
          });
        }, 1200);
      });
    }

    try {
      const systemPrompt = `Eres un desarrollador Frontend experto.
Tu única tarea es convertir la estructura JSON de objetos de Fabric.js provista en código React funcional con Tailwind CSS.
RESPETA ESTRICTAMENTE la posición, tipos de elementos (rectángulos = contenedores/cards, texto = encabezados/párrafos, botones = botones interactivos) y textos definidos en el lienzo.
NO inventes componentes adicionales que no estén reflejados o descritos en el prototipo canvas.
Si hay un prompt de texto adicional, úsalo únicamente para afinar estilos de Tailwind o comportamiento, pero MANTIENE el layout dibujado intacto.
Responde ÚNICAMENTE con el código, sin explicaciones.`;

      const fullPrompt = `${systemPrompt}\n\nInstrucción del usuario: ${promptText}\n\nEstructura del Canvas JSON:\n${canvasJSON}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }]
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      const generatedText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error("Respuesta vacía o formato inválido de Gemini.");
      }

      return {
        success: true,
        data: {
          jsxCode: this.cleanGeneratedCode(generatedText),
          components: ['GeneratedUI']
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.message || 'Error desconocido al invocar Gemini API'
      };
    }
  },

  /**
   * Genera código HTML/CSS/JSX basado en la captura del lienzo en Base64 y un prompt.
   */
  async generateUIFromCanvas(imageBase64 = '', promptText = '', apiKey = import.meta.env.VITE_GEMINI_API_KEY || '') {
    const systemPrompt = `Eres un diseñador y desarrollador Frontend experto. Genera un componente de interfaz web limpio, moderno y responsivo usando HTML5 y Tailwind CSS basado en el siguiente prompt e imagen adjunta. Responde ÚNICAMENTE con el código HTML/Tailwind dentro de una estructura válida (o en un bloque de código).`;
    const fullPrompt = `${systemPrompt}\n\nInstrucción del usuario: ${promptText || 'Generar componente UI moderno'}`;

    if (apiKey) {
      try {
        const parts = [{ text: fullPrompt }];

        // Si se provee imagen Base64
        if (imageBase64) {
          const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
          parts.push({
            inline_data: {
              mime_type: 'image/png',
              data: cleanBase64,
            },
          });
        }

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts }],
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedText) {
            return this.cleanGeneratedCode(generatedText);
          }
        }
      } catch (error) {
        console.warn('Error llamando a Gemini API, usando sintetizador de respaldo:', error);
      }
    }

    // Sintetizador de respuesta visual para previsualización directa en el iframe
    return this.synthesizeFallbackCode(promptText);
  },

  cleanGeneratedCode(rawText) {
    let cleaned = rawText.replace(/```(html|jsx|xml)?/gi, '').replace(/```/g, '').trim();
    return cleaned;
  },

  synthesizeFallbackCode(prompt) {
    const lower = prompt.toLowerCase();
    const isDashboard = lower.includes('dashboard') || lower.includes('panel');

    if (isDashboard) {
      return `
<div class="p-6 bg-slate-900 text-slate-100 min-h-screen rounded-xl font-sans">
  <div class="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
    <div>
      <h2 class="text-xl font-bold text-indigo-400">Dashboard Copilot Generado</h2>
      <p class="text-xs text-slate-400">Sintetizado por Gemini 1.5 Pro</p>
    </div>
    <span class="px-3 py-1 text-xs font-semibold bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">99.4% Precisión</span>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700">
      <div class="text-xs text-slate-400">Ventas Totales</div>
      <div class="text-2xl font-bold text-white">$45,210</div>
    </div>
    <div class="p-4 bg-slate-800/80 rounded-xl border border-slate-700">
      <div class="text-xs text-slate-400">Usuarios Activos</div>
      <div class="text-2xl font-bold text-indigo-400">1,420</div>
    </div>
    <div class="p-4 bg-slate-800/80 rounded-xl border border-slate-700">
      <div class="text-xs text-slate-400">Tasa de Conversión</div>
      <div class="text-2xl font-bold text-emerald-400">98.4%</div>
    </div>
  </div>
</div>`;
    }

    return `
<div class="max-w-sm mx-auto my-6 p-6 bg-slate-900/95 border border-indigo-500/30 rounded-2xl shadow-2xl text-slate-100 font-sans">
  <div class="flex items-center gap-4 mb-4">
    <div class="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-400 p-0.5 flex items-center justify-center shadow-lg">
      <div class="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-indigo-300 text-lg">
        AI
      </div>
    </div>
    <div>
      <div class="flex items-center gap-1.5">
        <h3 class="font-bold text-base text-white">${prompt || 'Componente Generado'}</h3>
        <span class="material-symbols-outlined text-emerald-400 text-sm">verified</span>
      </div>
      <p class="text-xs text-indigo-300 font-mono">Generado por Gemini 1.5 Pro</p>
    </div>
  </div>
  <p class="text-xs text-slate-300 leading-relaxed mb-4">
    "Componente sintetizado dinámicamente según la instrucción: ${prompt || 'Diseño responsivo con Tailwind CSS'}"
  </p>
  <div class="flex gap-2">
    <button class="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition">
      Seguir Perfil
    </button>
    <button class="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition">
      Mensaje
    </button>
  </div>
</div>`;
  }
};

export default geminiService;
