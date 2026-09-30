const N8N_REGISTER_WEBHOOK = import.meta.env.VITE_N8N_REGISTER_WEBHOOK_URL || 'https://n8n.canvasai.fwd/webhook/user-registration';
const N8N_PROJECT_WEBHOOK = import.meta.env.VITE_N8N_PROJECT_EXPORT_WEBHOOK_URL || 'https://n8n.canvasai.fwd/webhook/project-export';
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/chat-ejercicio-1';

// Webhooks de Autenticación N8N
const N8N_AUTH_BASE = import.meta.env.VITE_N8N_AUTH_BASE_URL || 'http://localhost:5678/webhook/chat-ejercicio-1';

export const n8nService = {
  /**
   * Dispara un flujo genérico en N8N (Agentes de IA / Copilot)
   */
  async triggerWorkflow(payload) {
    const targetUrl = N8N_WEBHOOK_URL || N8N_AUTH_BASE;

    if (!targetUrl) {
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
      const requestPayload = {
        action: 'generate',
        prompt: payload.prompt || '',
        message: payload.prompt || payload.message || '',
        canvasJson: payload.canvasJson || {},
        user: payload.user || null,
        model: payload.model || 'gemini',
        ...payload
      };

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        throw new Error(`Error HTTP de n8n: ${response.status}`);
      }

      const result = await response.json().catch(() => ({}));
      console.log('🤖 RESPUESTA DE AGENTE N8N:', result);
      
      let extractedJsx = result;
      if (result.output) extractedJsx = result.output;
      else if (result.text) extractedJsx = result.text;
      else if (result.message) extractedJsx = result.message;
      else if (result.response) extractedJsx = result.response;
      else if (Array.isArray(result) && result[0]?.output) extractedJsx = result[0].output;
      else if (Array.isArray(result) && result[0]?.text) extractedJsx = result[0].text;
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
   * Inicia sesión llamando al webhook de N8N
   */
  async login(email, password, role) {
    try {
      const response = await fetch(`${N8N_AUTH_BASE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password, role }),
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        
        // Formateo de respuesta asegurado para AuthCard
        const userData = data.user || data.data?.user || {
          id: data.id || `usr_${Date.now()}`,
          email: email,
          name: data.name || email.split('@')[0],
          role: role || data.role || 'admin'
        };

        return {
          success: data.success !== false,
          user: userData
        };
      }
      return { success: false, error: 'Credenciales inválidas o error de servidor.' };
    } catch (error) {
      console.warn('⚠️ N8N Auth offline (modo simulación activo):', error.message);
      if (email && password) {
        return {
          success: true,
          simulated: true,
          user: {
            id: 'sim_user_1',
            email,
            name: email.split('@')[0],
            role: role || 'admin'
          }
        };
      }
      return { success: false, error: 'No se pudo conectar con N8N.' };
    }
  },

  /**
   * Solicita el registro y el envío del código OTP vía correo en N8N
   */
  async requestRegistration({ fullName, email, password, role }) {
    try {
      const response = await fetch(`${N8N_AUTH_BASE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'register', 
          fullName, 
          email, 
          password, 
          role 
        }),
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        return {
          success: data.success !== false,
          data
        };
      }
      return { success: false, error: 'No se pudo procesar el registro en el servidor.' };
    } catch (error) {
      console.warn('⚠️ N8N Auth offline (modo simulación activo):', error.message);
      return {
        success: true,
        simulated: true,
        message: 'Código simulado enviado a su correo'
      };
    }
  },

  /**
   * Verifica el código de seguridad OTP ingresado
   */
  async verifyCode(email, code) {
    try {
      const response = await fetch(`${N8N_AUTH_BASE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', email, code }),
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        const userData = data.user || {
          id: `usr_${Date.now()}`,
          email,
          name: email.split('@')[0],
          role: 'admin'
        };
        return {
          success: data.success !== false,
          user: userData
        };
      }
      return { success: false, error: 'Código de verificación inválido.' };
    } catch (error) {
      console.warn('⚠️ N8N Auth offline (modo simulación activo):', error.message);
      return {
        success: true,
        simulated: true,
        user: {
          id: `usr_${Date.now()}`,
          email,
          name: email.split('@')[0],
          role: 'admin'
        }
      };
    }
  },

  /**
   * Envía un webhook POST a N8N al completar el registro de un nuevo usuario.
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const resData = await response.json().catch(() => ({}));
        return { success: true, data: resData };
      }
    } catch (error) {
      console.warn('⚠️ N8N Webhook Server no alcanzable:', error.message);
    }

    return {
      success: true,
      simulated: true,
      message: 'Webhook simulado con éxito (Servidor N8N offline)',
      payload,
    };
  },

  /**
   * Envía un webhook POST a N8N al guardar o exportar un proyecto finalizado desde el lienzo.
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const resData = await response.json().catch(() => ({}));
        return { success: true, data: resData };
      }
    } catch (error) {
      console.warn('⚠️ N8N Webhook Server no alcanzable:', error.message);
    }

    return {
      success: true,
      simulated: true,
      message: 'Webhook de exportación simulado con éxito (Servidor N8N offline)',
      payload,
    };
  },
};

export default n8nService;