const API_BASE_URL = 'http://localhost:3000';

// Estado local de respaldo cuando JSON Server no está corriendo
let localUsers = [
  { id: '1', email: 'admin@canvasai.fwd', name: 'Isaac Andrés Cascante Linares', role: 'admin' },
  { id: '2', email: 'usuario@canvasai.fwd', name: 'Usuario Desarrollador FWD', role: 'user' },
  { id: '3', email: 'maria@canvasai.fwd', name: 'María Rodríguez', role: 'user' },
];

let localProjects = [
  { id: 'p1', name: 'Dashboard Administrativo CanvasAI', description: 'Panel de administración y estadísticas de IA', createdAt: '2026-09-15T10:00:00Z', status: 'activo', ownerId: '1' },
  { id: 'p2', name: 'Lienzo Copilot Generativo', description: 'Estudio visual interactivo con Fabric.js y Gemini 1.5', createdAt: '2026-09-18T11:30:00Z', status: 'en progreso', ownerId: '2' },
  { id: 'p3', name: 'Landing Page Multimodal', description: 'Página de inicio sintetizada automáticamente', createdAt: '2026-09-20T14:20:00Z', status: 'completado', ownerId: '3' },
];

export const apiService = {
  // ================= USERS CRUD =================
  async getUsers() {
    try {
      const res = await fetch(`${API_BASE_URL}/users`);
      if (res.ok) {
        const data = await res.json();
        localUsers = data;
        return data;
      }
    } catch (e) {
      console.warn('JSON Server offline, usando usuarios locales de respaldo');
    }
    return [...localUsers];
  },

  async createUser(userData) {
    const newUser = { id: Date.now().toString(), ...userData };
    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('JSON Server offline, guardando usuario en memoria local');
    }
    localUsers.push(newUser);
    return newUser;
  },

  async updateUser(id, userData) {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('JSON Server offline, actualizando usuario en memoria local');
    }
    localUsers = localUsers.map((u) => (u.id === id ? { ...u, ...userData } : u));
    return { id, ...userData };
  },

  async deleteUser(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        return true;
      }
    } catch (e) {
      console.warn('JSON Server offline, eliminando usuario de memoria local');
    }
    localUsers = localUsers.filter((u) => u.id !== id);
    return true;
  },

  // ================= PROJECTS CRUD =================
  async getProjects() {
    try {
      const res = await fetch(`${API_BASE_URL}/projects`);
      if (res.ok) {
        const data = await res.json();
        localProjects = data;
        return data;
      }
    } catch (e) {
      console.warn('JSON Server offline, usando proyectos locales de respaldo');
    }
    return [...localProjects];
  },

  async createProject(projectData) {
    const newProject = {
      id: `p_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'activo',
      ...projectData,
    };
    try {
      const res = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('JSON Server offline, guardando proyecto en memoria local');
    }
    localProjects.push(newProject);
    return newProject;
  },

  async updateProject(id, projectData) {
    try {
      const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('JSON Server offline, actualizando proyecto en memoria local');
    }
    localProjects = localProjects.map((p) => (p.id === id ? { ...p, ...projectData } : p));
    return { id, ...projectData };
  },

  async deleteProject(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        return true;
      }
    } catch (e) {
      console.warn('JSON Server offline, eliminando proyecto de memoria local');
    }
    localProjects = localProjects.filter((p) => p.id !== id);
    return true;
  },
};

export default apiService;
