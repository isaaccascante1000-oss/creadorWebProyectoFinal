const API_URL = 'http://localhost:3000';
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || '';
const AUTH_CALLBACK_URL = import.meta.env.VITE_AUTH_CALLBACK_URL || `${window.location.origin}/login`;

const DEFAULT_USERS = [
  {
    id: "1",
    email: "admin@canvasai.fwd",
    password: "123",
    name: "Isaac Andrés Cascante Linares",
    role: "admin"
  },
  {
    id: "2",
    email: "usuario@canvasai.fwd",
    password: "123",
    name: "Usuario Desarrollador FWD",
    role: "user"
  }
];

export const authService = {
  /**
   * Autentica un usuario intentando JSON Server y con fallback local.
   */
  async login(email, password, selectedRole = 'admin') {
    try {
      const response = await fetch(`${API_URL}/users?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const users = await response.json();
        const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (foundUser && foundUser.password === password) {
          // Si coincide la contraseña o en modo dev
          const sessionUser = {
            id: foundUser.id,
            email: foundUser.email,
            name: foundUser.name,
            role: foundUser.role || selectedRole
          };
          this.setSession(sessionUser);
          return { success: true, user: sessionUser };
        }
      }
    } catch (err) {
      console.warn('JSON Server no disponible en http://localhost:3000. Usando autenticación local de respaldo.', err);
    }

    // Fallback con credenciales predeterminadas
    const fallbackUser = DEFAULT_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!fallbackUser || fallbackUser.password !== password) {
      return { success: false, error: 'Correo o contraseña incorrectos.' };
    }
    const roleToAssign = fallbackUser ? fallbackUser.role : (selectedRole === 'dev' ? 'user' : selectedRole);
    
    const sessionUser = {
      id: fallbackUser ? fallbackUser.id : Date.now().toString(),
      email: email,
      name: fallbackUser ? fallbackUser.name : (email.split('@')[0] || 'Usuario CanvasAI'),
      role: roleToAssign
    };

    this.setSession(sessionUser);
    return { success: true, user: sessionUser };
  },

  startOAuth(provider) {
    if (!AUTH_API_URL) {
      return {
        success: false,
        error: 'El inicio de sesión social no está configurado en el servidor.',
      };
    }

    const normalizedProvider = provider.toLowerCase();
    if (!['google', 'github'].includes(normalizedProvider)) {
      return { success: false, error: 'Proveedor de autenticación no válido.' };
    }

    const state = crypto.randomUUID();
    sessionStorage.setItem('canvasai_oauth_state', state);
    sessionStorage.setItem('canvasai_oauth_provider', normalizedProvider);

    const authorizationUrl = new URL(`/oauth/${normalizedProvider}`, AUTH_API_URL);
    authorizationUrl.searchParams.set('redirect_uri', AUTH_CALLBACK_URL);
    authorizationUrl.searchParams.set('state', state);
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
        body: JSON.stringify({ code, state, provider, redirectUri: AUTH_CALLBACK_URL }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.user) {
        return { success: false, error: data.error || 'No se pudo completar la autenticación.' };
      }

      this.setSession(data.user);
      return { success: true, user: data.user };
    } catch {
      return { success: false, error: 'No se pudo contactar con el servidor de autenticación.' };
    }
  },

  /**
   * Guarda la sesión en localStorage
   */
  setSession(user) {
    localStorage.setItem('canvasai_user', JSON.stringify(user));
  },

  /**
   * Cierra la sesión
   */
  logout() {
    localStorage.removeItem('canvasai_user');
  },

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser() {
    const userStr = localStorage.getItem('canvasai_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  /**
   * Obtiene el rol almacenado
   */
  getUserRole() {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  },

  /**
   * Verifica si existe una sesión activa
   */
  isAuthenticated() {
    return Boolean(this.getCurrentUser());
  }
};

export default authService;
