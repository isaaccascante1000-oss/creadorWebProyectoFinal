import { getErrorMessage } from '../utils/errorMessage';

const API_URL = import.meta.env.VITE_AUTH_API_URL || `${window.location.protocol}//${window.location.hostname}:3001`;

const postProxyRequest = async (path, payload) => {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(45_000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        success: false,
        data: null,
        error: getErrorMessage(data, `Solicitud rechazada (${response.status}).`),
      };
    }
    return { success: true, data, error: null };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: getErrorMessage(error, 'No se pudo contactar con el servicio seguro.'),
    };
  }
};

export const n8nService = {
  async triggerWorkflow(payload = {}) {
    const result = await postProxyRequest('/api/n8n/chat', {
      action: 'GENERATE_UI',
      prompt: typeof payload.prompt === 'string' ? payload.prompt : '',
      canvasData: payload.canvasData && typeof payload.canvasData === 'object' ? payload.canvasData : {},
    });
    if (!result.success) return result;

    const responseData = result.data;
    let code = responseData.output || responseData.text || responseData.code || responseData.jsxCode || responseData.message || responseData.response || responseData;
    if (Array.isArray(code)) code = code[0]?.output || code[0]?.text || code;
    return { success: true, data: { jsxCode: typeof code === 'string' ? code : JSON.stringify(code) }, error: null };
  },

  async sendProjectExportWebhook(projectData = {}) {
    return postProxyRequest('/api/n8n/project-export', {
      prompt: typeof projectData.prompt === 'string' ? projectData.prompt : '',
      canvasData: projectData.canvasData && typeof projectData.canvasData === 'object'
        ? projectData.canvasData
        : {},
      project: {
        id: projectData.id,
        title: projectData.title || projectData.prompt || 'Proyecto CanvasAI',
        prompt: typeof projectData.prompt === 'string' ? projectData.prompt : '',
        code: typeof projectData.code === 'string' ? projectData.code.slice(0, 50_000) : '',
        format: projectData.format || 'HTML',
        metadata: projectData.metadata && typeof projectData.metadata === 'object'
          ? projectData.metadata
          : {},
      },
    });
  },
};

export default n8nService;
