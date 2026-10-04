import { getErrorMessage } from '../utils/errorMessage';

const API_URL = import.meta.env.VITE_AUTH_API_URL || `${window.location.protocol}//${window.location.hostname}:3001`;

const requestGeneration = async ({ prompt, canvas = '', image }) => {
  try {
    const response = await fetch(`${API_URL}/api/ai/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ prompt, canvas, image }),
      signal: AbortSignal.timeout(45_000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(getErrorMessage(data, `Gemini rechazó la solicitud (${response.status}).`));
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) throw new Error('Gemini devolvió una respuesta vacía.');
    return { success: true, data: { jsxCode: cleanGeneratedCode(generatedText) }, error: null };
  } catch (error) {
    return { success: false, data: null, error: getErrorMessage(error, 'No se pudo generar la interfaz.') };
  }
};

const cleanGeneratedCode = (rawText) => rawText.replace(/```(?:html|jsx|xml)?/gi, '').replace(/```/g, '').trim();

export const geminiService = {
  generateUIFromPrompt(promptText, canvasJSON = '{}') {
    return requestGeneration({ prompt: promptText, canvas: canvasJSON });
  },

  async generateUIFromCanvas(imageBase64 = '', promptText = '') {
    const result = await requestGeneration({ prompt: promptText, image: imageBase64 });
    return result.success ? result.data.jsxCode : result;
  },

  cleanGeneratedCode,
};

export default geminiService;
