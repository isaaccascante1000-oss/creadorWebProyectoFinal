const API_BASE_URL = import.meta.env.VITE_AUTH_API_URL || `${window.location.protocol}//${window.location.hostname}:3001`;

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || `Solicitud rechazada (${response.status}).`);
  return data;
};

export const apiService = {
  getUsers: () => request('/api/admin/users'),
  createUser: (userData) => request('/api/admin/users', { method: 'POST', body: JSON.stringify(userData) }),
  updateUser: (id, userData) => request(`/api/admin/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(userData) }),
  deleteUser: async (id) => {
    await request(`/api/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return true;
  },
  getProjects: () => request('/api/projects'),
  getProjectsByOwner: () => request('/api/projects'),
  createProject: (projectData) => request('/api/projects', { method: 'POST', body: JSON.stringify(projectData) }),
  updateProject: (id, projectData) => request(`/api/projects/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(projectData) }),
  updateProjectStatus: (id, status) => request(`/api/projects/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteProject: async (id) => {
    await request(`/api/projects/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return true;
  },
  async getExternalData() {
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=3');
      return response.ok ? response.json() : [];
    } catch {
      return [];
    }
  },
};

export default apiService;
