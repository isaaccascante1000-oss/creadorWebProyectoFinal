export const mistralService = {
  generateUIFromPrompt: async (promptText, canvasJSON) => {
    const API_KEY = import.meta.env.VITE_MISTRAL_API_KEY;

    // Fallback parser si no hay API Key o falla
    const localFallbackParse = (jsonString) => {
      try {
        const data = JSON.parse(jsonString);
        const objects = data.objects || [];
        
        if (objects.length === 0) {
          return `<div className="flex items-center justify-center h-full text-slate-500">Lienzo vacío</div>`;
        }

        let jsxString = `<div className="relative w-full h-full bg-slate-900 overflow-hidden">\n`;

        objects.forEach(obj => {
          const type = obj.type;
          const left = Math.round(obj.left || 0);
          const top = Math.round(obj.top || 0);
          const width = Math.round((obj.width || 0) * (obj.scaleX || 1));
          const height = Math.round((obj.height || 0) * (obj.scaleY || 1));
          const fill = obj.fill || 'transparent';
          const opacity = obj.opacity !== undefined ? obj.opacity : 1;

          const styleStr = `position: 'absolute', left: '${left}px', top: '${top}px', width: '${width}px', height: '${height}px', backgroundColor: '${fill}', opacity: ${opacity}`;

          if (type === 'rect') {
            const rx = obj.rx || 0;
            const radiusStr = rx ? `, borderRadius: '${rx}px'` : '';
            jsxString += `  <div style={{ ${styleStr}${radiusStr} }}></div>\n`;
          } else if (type === 'circle') {
            jsxString += `  <div style={{ ${styleStr}, borderRadius: '50%' }}></div>\n`;
          } else if (type === 'i-text' || type === 'textbox' || type === 'text') {
            const text = obj.text || '';
            const fontSize = obj.fontSize || 16;
            const color = obj.fill || '#ffffff';
            const textStyle = `position: 'absolute', left: '${left}px', top: '${top}px', color: '${color}', fontSize: '${fontSize}px', opacity: ${opacity}`;
            jsxString += `  <div style={{ ${textStyle} }}>${text}</div>\n`;
          } else if (type === 'group') {
            jsxString += `  <div style={{ position: 'absolute', left: '${left}px', top: '${top}px' }}>{/* Grupo de elementos */}</div>\n`;
          }
        });

        jsxString += `</div>`;
        return jsxString;
      } catch (error) {
        return `<div className="text-red-500">Error en el parseo local del lienzo.</div>`;
      }
    };

    if (!API_KEY) {
      console.warn('No se encontró VITE_MISTRAL_API_KEY. Usando fallback local sintáctico.');
      return {
        success: true,
        data: {
          jsxCode: localFallbackParse(canvasJSON),
        },
        error: null,
      };
    }

    try {
      const systemPrompt = `Eres un compilador de UI. Convierte el JSON del lienzo y el prompt en código HTML/JSX con Tailwind CSS. Devuelve ÚNICAMENTE el código sin explicaciones ni bloques de markdown.`;

      const userMessage = `Prompt del usuario: ${promptText}\n\nEstructura JSON del Lienzo:\n${canvasJSON}\n\nDevuelve SOLAMENTE código JSX (sin formato de markdown \`\`\`jsx ... \`\`\`).`;

      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: 'mistral-small-latest',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.2
        })
      });

      if (!response.ok) {
        throw new Error(`Mistral API Error: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      let jsxResult = responseData.choices[0].message.content.trim();

      // Limpiar markdown si Mistral lo incluye
      if (jsxResult.startsWith('\`\`\`')) {
        jsxResult = jsxResult.replace(/^\`\`\`(jsx|javascript|html)?\n/i, '').replace(/\n\`\`\`$/, '');
      }

      return {
        success: true,
        data: {
          jsxCode: jsxResult,
        },
        error: null,
      };
    } catch (error) {
      console.error('Error llamando a Mistral API:', error);
      console.warn('Usando fallback local tras el fallo de Mistral.');
      return {
        success: true,
        data: {
          jsxCode: localFallbackParse(canvasJSON),
        },
        error: null,
      };
    }
  }
};
