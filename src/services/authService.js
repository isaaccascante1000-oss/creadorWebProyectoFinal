const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || `${window.location.protocol}//${window.location.hostname}:3001`;
const authAppUrl = new URL(import.meta.env.VITE_AUTH_APP_URL || `${window.location.origin}/login`);
authAppUrl.hash = '/login';
const AUTH_APP_URL = authAppUrl.toString();

export const authService = {
  async getSession() {
    try {
      const response = await fetch(`${AUTH_API_URL}/auth/session`, { credentials: 'include' });
      if (!response.ok) return null;
      const data = await response.json();
      return data.user || null;
    } catch (err) {
      console.warn('No se pudo verificar la sesión en el servidor.', err);
      return null;
    }
  },

  startOAuth(provider, termsAccepted = false) {
    if (termsAccepted !== true) {
      return { success: false, error: 'Debes aceptar los Términos y Condiciones antes de continuar.' };
    }
    const normalizedProvider = provider.toLowerCase();
    if (!['google', 'github'].includes(normalizedProvider)) {
      return { success: false, error: 'Proveedor de autenticación no válido.' };
    }

    const state = crypto.randomUUID();
    sessionStorage.setItem('canvasai_oauth_state', state);
    sessionStorage.setItem('canvasai_oauth_provider', normalizedProvider);

    const authorizationUrl = new URL(`/oauth/${normalizedProvider}`, AUTH_API_URL);
    authorizationUrl.searchParams.set('redirect_uri', AUTH_APP_URL);
    authorizationUrl.searchParams.set('state', state);
    authorizationUrl.searchParams.set('terms_accepted', 'true');
    window.location.assign(authorizationUrl.toString());

    return { success: true };
  },

  async completeOAuthCallback(search = window.location.search) {
    const params = new URLSearchParams(search);
    const error = params.get('error');
    const code = params.get('code');
    const state = params.get('state');
    const expectedState = sessionStorage.getItem('canvasai_oauth_state');
    const provider = sessionStorage.getItem('canvasai_oauth_provider');

    sessionStorage.removeItem('canvasai_oauth_state');
    sessionStorage.removeItem('canvasai_oauth_provider');

    if (error) {
      return { success: false, error: 'La autenticación fue cancelada o rechazada.' };
    }
    if (!code || !state || !expectedState || state !== expectedState || !provider) {
      return { success: false, error: 'La respuesta de autenticación no es válida.' };
    }
    if (!AUTH_API_URL) {
      return { success: false, error: 'El inicio de sesión social no está configurado en el servidor.' };
    }

    try {
      const response = await fetch(`${AUTH_API_URL}/oauth/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code, state, provider, redirectUri: AUTH_APP_URL }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.user) {
        return { success: false, error: data.error || 'No se pudo completar la autenticación.' };
      }

      return { success: true, user: data.user };
    } catch {
      return { success: false, error: 'No se pudo contactar con el servidor de autenticación.' };
    }
  },

  async logout() {
    try {
      await fetch(`${AUTH_API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.warn('No se pudo invalidar la sesión remota.', err);
    }
  }
};

export default authService;
