const N8N_REGISTER_WEBHOOK = import.meta.env.VITE_N8N_REGISTER_WEBHOOK_URL || 'https://n8n.canvasai.fwd/webhook/user-registration';
const N8N_PROJECT_WEBHOOK = import.meta.env.VITE_N8N_PROJECT_EXPORT_WEBHOOK_URL || 'https://n8n.canvasai.fwd/webhook/project-export';

export const n8nService = {
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
