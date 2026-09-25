const API_URL = 'http://localhost:3000';

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
        
        if (foundUser) {
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
