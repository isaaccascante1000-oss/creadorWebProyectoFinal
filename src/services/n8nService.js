const N8N_REGISTER_WEBHOOK = import.meta.env.VITE_N8N_REGISTER_WEBHOOK_URL || 'https://n8n.canvasai.fwd/webhook/user-registration';
const N8N_PROJECT_WEBHOOK = import.meta.env.VITE_N8N_PROJECT_EXPORT_WEBHOOK_URL || 'https://n8n.canvasai.fwd/webhook/project-export';
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/chat-ejercicio-1';

export const n8nService = {
  /**
   * Dispara un flujo genérico en N8N
   * @param {Object} payload - Carga útil a enviar
   */
  async triggerWorkflow(payload) {
    if (!N8N_WEBHOOK_URL) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            result: { message: 'Simulated success (No VITE_N8N_WEBHOOK_URL)', data: payload },
            error: null
          });
        }, 1500);
      });
    }

    try {
      // Ensure payload matches expected structure requested
      const requestPayload = {
        prompt: payload.prompt || '',
        canvasJson: payload.canvasJson || {},
        user: payload.user || null,
        ...payload
      };

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        throw new Error(`Error HTTP de n8n: ${response.status}`);
      }

      // n8n 'Respond to Webhook' node returns JSON.
      const result = await response.json().catch(() => ({}));
      console.log('DEBUG N8N RESPONSE:', result);
      
      let extractedJsx = result;
      if (result.output) extractedJsx = result.output;
      else if (result.text) extractedJsx = result.text;
      else if (result.message) extractedJsx = result.message;
      else if (Array.isArray(result) && result[0]?.output) extractedJsx = result[0].output;
      else if (typeof result === 'string') extractedJsx = result;

      return { 
        success: true, 
        data: { jsxCode: extractedJsx },
        error: null 
      };
    } catch (error) {
      console.error('Error al contactar n8n webhook:', error);
      return { 
        success: false, 
        result: null, 
        error: 'No se pudo contactar al servidor n8n. ' + error.message 
      };
    }
  },
  /**
   * Envía un webhook POST a N8N al completar el registro de un nuevo usuario.
   * @param {Object} userData - Datos del usuario registrado (email, nombre, rol)
   */
  async sendUserRegistrationWebhook(userData) {
    const payload = {
      event: 'USER_REGISTRATION_COMPLETED',
      timestamp: new Date().toISOString(),
      source: 'CanvasAI Web Platform',
      user: {
        email: userData.email,
        name: userData.name || userData.fullName || 'Usuario Registrado',
        role: userData.role || 'user',
        registeredAt: new Date().toISOString(),
      },
    };

    try {
      console.log('⚡ N8N Webhook: Enviando datos de registro a N8N...', payload);
      const response = await fetch(N8N_REGISTER_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const resData = await response.json().catch(() => ({}));
        console.log('✅ N8N Webhook Registro exitoso:', resData);
        return { success: true, data: resData };
      }
    } catch (error) {
      console.warn('⚠️ N8N Webhook Server no alcanzable (modo simulación activo):', error.message);
    }

    // Modo simulación cuando N8N no está activo localmente
    return {
      success: true,
      simulated: true,
      message: 'Webhook simulado con éxito (Servidor N8N offline)',
      payload,
    };
  },

  /**
   * Envía un webhook POST a N8N al guardar o exportar un proyecto finalizado desde el lienzo.
   * @param {Object} projectData - Datos del proyecto exportado (id, título, prompt, código generado, usuario)
   */
  async sendProjectExportWebhook(projectData) {
    const payload = {
      event: 'PROJECT_EXPORTED',
      timestamp: new Date().toISOString(),
      source: 'CanvasAI Copilot Studio',
      project: {
        id: projectData.id || `proj_${Date.now()}`,
        title: projectData.title || projectData.prompt || 'Proyecto Generativo CanvasAI',
        prompt: projectData.prompt || '',
        codeSnippet: projectData.code ? projectData.code.substring(0, 500) : '',
        codeFullLength: projectData.code ? projectData.code.length : 0,
        exportedBy: projectData.user?.email || 'desconocido',
        exportFormat: projectData.format || 'React + Tailwind JSX',
      },
    };

    try {
      console.log('⚡ N8N Webhook: Enviando exportación de proyecto a N8N...', payload);
      const response = await fetch(N8N_PROJECT_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const resData = await response.json().catch(() => ({}));
        console.log('✅ N8N Webhook Exportación de proyecto exitosa:', resData);
        return { success: true, data: resData };
      }
    } catch (error) {
      console.warn('⚠️ N8N Webhook Server no alcanzable (modo simulación activo):', error.message);
    }

    // Modo simulación cuando N8N no está activo localmente
    return {
      success: true,
      simulated: true,
      message: 'Webhook de exportación simulado con éxito (Servidor N8N offline)',
      payload,
    };
  },
};

export default n8nService;
