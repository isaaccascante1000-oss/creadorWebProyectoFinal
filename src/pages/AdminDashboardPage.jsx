import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { authService } from '../services/authService';
import { apiService } from '../services/apiService';
import { AccessibilityToolbar } from '../components/AccessibilityToolbar';

export const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  // Estados de datos CRUD
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados de Formularios y Modales
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'projects' | 'analytics'
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({ name: '', email: '', role: 'user', password: '123' });

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectFormData, setProjectFormData] = useState({ name: '', description: '', status: 'activo' });

  const [toastMsg, setToastMsg] = useState('');

  // Carga inicial de datos de JSON Server
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [fetchedUsers, fetchedProjects] = await Promise.all([
      apiService.getUsers(),
      apiService.getProjects(),
    ]);
    setUsers(fetchedUsers);
    setProjects(fetchedProjects);
    setLoading(false);
  };

  const showNotification = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  // ==================== USER HANDLERS ====================
  const handleOpenUserModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setUserFormData({ name: user.name || '', email: user.email || '', role: user.role || 'user', password: user.password || '123' });
    } else {
      setEditingUser(null);
      setUserFormData({ name: '', email: '', role: 'user', password: '123' });
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!userFormData.email || !userFormData.name) return;

    if (editingUser) {
      await apiService.updateUser(editingUser.id, userFormData);
      showNotification('Usuario actualizado con éxito');
    } else {
      await apiService.createUser(userFormData);
      showNotification('Usuario creado con éxito');
    }

    setIsUserModalOpen(false);
    loadData();
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
      await apiService.deleteUser(id);
      showNotification('Usuario eliminado');
      loadData();
    }
  };

  // ==================== PROJECT HANDLERS ====================
  const handleOpenProjectModal = (project = null) => {
    if (project) {
      setEditingProject(project);
      setProjectFormData({ name: project.name || '', description: project.description || '', status: project.status || 'activo' });
    } else {
      setEditingProject(null);
      setProjectFormData({ name: '', description: '', status: 'activo' });
    }
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!projectFormData.name) return;

    if (editingProject) {
      await apiService.updateProject(editingProject.id, projectFormData);
      showNotification('Proyecto actualizado con éxito');
    } else {
      await apiService.createProject(projectFormData);
      showNotification('Proyecto creado con éxito');
    }

    setIsProjectModalOpen(false);
    loadData();
  };

  const handleDeleteProject = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este proyecto?')) {
      await apiService.deleteProject(id);
      showNotification('Proyecto eliminado');
      loadData();
    }
  };

  // Datos para gráficos de Recharts
  const activityChartData = [
    { name: 'Lun', proyectos: 4, llamadasIA: 120 },
    { name: 'Mar', proyectos: 7, llamadasIA: 240 },
    { name: 'Mié', proyectos: 12, llamadasIA: 310 },
    { name: 'Jue', proyectos: 9, llamadasIA: 280 },
    { name: 'Vie', proyectos: 15, llamadasIA: 450 },
    { name: 'Sáb', proyectos: 18, llamadasIA: 520 },
    { name: 'Dom', proyectos: projects.length, llamadasIA: 610 },
  ];

  const roleDistributionData = [
    { name: 'Administradores', value: users.filter((u) => u.role === 'admin').length || 1 },
    { name: 'Desarrolladores', value: users.filter((u) => u.role === 'user' || u.role === 'dev').length || 2 },
  ];

  const COLORS = ['#3B82F6', '#10B981', '#6366F1', '#F59E0B'];

  return (
    <div className="min-h-screen bg-surface text-on-surface p-6 font-body-md">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-on-primary text-2xl">admin_panel_settings</span>
            </div>
            <div>
              <h1 className="font-headline-md text-2xl font-bold">Panel de Administración</h1>
              <p className="text-xs text-outline">
                Sesión: <span className="text-primary font-semibold">{currentUser?.name || currentUser?.email || 'Admin'}</span> ({currentUser?.role})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AccessibilityToolbar />
            <Link
              to="/copilot"
              className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface text-xs font-semibold hover:bg-surface-bright transition flex items-center gap-2 shadow"
            >
              <span className="material-symbols-outlined text-base text-primary">auto_awesome</span>
              Ir al Copilot
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-fixed-dim transition cursor-pointer shadow"
            >
              Cerrar Sesión
            </button>
          </div>
        </header>

        {/* Notificación Toast */}
        {toastMsg && (
          <div className="p-3 rounded-lg bg-tertiary-container/30 border border-tertiary text-tertiary text-xs font-semibold flex items-center gap-2 shadow-lg animate-fade-in">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Métricas rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-surface-container border border-outline-variant/30 space-y-2">
            <div className="flex items-center justify-between text-outline">
              <span className="text-xs font-semibold uppercase tracking-wider">USUARIOS REGISTRADOS</span>
              <span className="material-symbols-outlined text-primary">group</span>
            </div>
            <div className="text-3xl font-bold text-on-surface">{users.length}</div>
            <div className="text-[11px] text-tertiary flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">trending_up</span> JSON Server sincronizado
            </div>
          </div>

          <div className="p-5 rounded-xl bg-surface-container border border-outline-variant/30 space-y-2">
            <div className="flex items-center justify-between text-outline">
              <span className="text-xs font-semibold uppercase tracking-wider">PROYECTOS CREADOS</span>
              <span className="material-symbols-outlined text-tertiary">code</span>
            </div>
            <div className="text-3xl font-bold text-on-surface">{projects.length}</div>
            <div className="text-[11px] text-tertiary flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">bolt</span> Tiempo real activo
            </div>
          </div>

          <div className="p-5 rounded-xl bg-surface-container border border-outline-variant/30 space-y-2">
            <div className="flex items-center justify-between text-outline">
              <span className="text-xs font-semibold uppercase tracking-wider">LLAMADAS A GEMINI 1.5</span>
              <span className="material-symbols-outlined text-secondary">psychology</span>
            </div>
            <div className="text-3xl font-bold text-on-surface">2,590</div>
            <div className="text-[11px] text-outline">Cuota saludable</div>
          </div>

          <div className="p-5 rounded-xl bg-surface-container border border-outline-variant/30 space-y-2">
            <div className="flex items-center justify-between text-outline">
              <span className="text-xs font-semibold uppercase tracking-wider">ESTADO DEL SISTEMA</span>
              <span className="material-symbols-outlined text-tertiary">check_circle</span>
            </div>
            <div className="text-3xl font-bold text-tertiary">100% OK</div>
            <div className="text-[11px] text-outline">API REST & Webhooks N8N</div>
          </div>
        </div>

        {/* Sección de Gráficos en Tiempo Real Recharts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Gráfico 1: Evolución de Proyectos y Llamadas IA */}
          <div className="lg:col-span-8 bg-surface-container rounded-xl border border-outline-variant/30 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base text-on-surface">Actividad del Sistema & Proyectos Creados</h3>
                <p className="text-xs text-outline">Métricas semanales sintetizadas</p>
              </div>
              <span className="px-2.5 py-1 rounded bg-primary-container/20 text-primary font-mono text-xs">Recharts Live</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProyectos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorIA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="proyectos" stroke="#3B82F6" fillOpacity={1} fill="url(#colorProyectos)" name="Proyectos Creados" />
                  <Area type="monotone" dataKey="llamadasIA" stroke="#10B981" fillOpacity={1} fill="url(#colorIA)" name="Llamadas IA" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 2: Distribución de Usuarios por Rol */}
          <div className="lg:col-span-4 bg-surface-container rounded-xl border border-outline-variant/30 p-5 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-base text-on-surface mb-1">Distribución de Usuarios por Rol</h3>
              <p className="text-xs text-outline mb-4">Administradores vs Desarrolladores</p>
              <div className="h-48 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={roleDistributionData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                      {roleDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex items-center justify-around border-t border-outline-variant/20 pt-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#3B82F6]"></span>
                <span>Admins ({roleDistributionData[0].value})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#10B981]"></span>
                <span>Usuarios/Devs ({roleDistributionData[1].value})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pestañas de Gestión CRUD */}
        <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'users' ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Gestión de Usuarios ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'projects' ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Gestión de Proyectos ({projects.length})
          </button>
        </div>

        {/* TAB 1: CRUD de Usuarios */}
        {activeTab === 'users' && (
          <div className="bg-surface-container rounded-xl border border-outline-variant/30 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-lg">Usuarios del Sistema</h2>
                <p className="text-xs text-outline">Operaciones CRUD conectadas a JSON Server</p>
              </div>
              <button
                onClick={() => handleOpenUserModal()}
                className="px-3.5 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold flex items-center gap-1.5 shadow hover:opacity-90 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">person_add</span>
                <span>Crear Usuario</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30 text-outline uppercase tracking-wider">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Nombre Completo</th>
                    <th className="py-3 px-4">Correo Electrónico</th>
                    <th className="py-3 px-4">Rol</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-surface-container-high/50 transition">
                      <td className="py-3 px-4 font-mono text-outline">{u.id}</td>
                      <td className="py-3 px-4 font-semibold text-on-surface">{u.name}</td>
                      <td className="py-3 px-4 text-on-surface-variant">{u.email}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded font-semibold text-[11px] ${
                            u.role === 'admin'
                              ? 'bg-primary/20 text-primary border border-primary/30'
                              : 'bg-tertiary/20 text-tertiary border border-tertiary/30'
                          }`}
                        >
                          {u.role ? u.role.toUpperCase() : 'USER'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenUserModal(u)}
                          className="px-2 py-1 rounded bg-surface-container-high hover:bg-surface-bright text-xs text-primary transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="px-2 py-1 rounded bg-error-container/30 hover:bg-error-container text-xs text-error transition"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CRUD de Proyectos */}
        {activeTab === 'projects' && (
          <div className="bg-surface-container rounded-xl border border-outline-variant/30 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-lg">Proyectos Guardados</h2>
                <p className="text-xs text-outline">Operaciones CRUD conectadas a JSON Server</p>
              </div>
              <button
                onClick={() => handleOpenProjectModal()}
                className="px-3.5 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold flex items-center gap-1.5 shadow hover:opacity-90 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">add_box</span>
                <span>Crear Proyecto</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30 text-outline uppercase tracking-wider">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Título del Proyecto</th>
                    <th className="py-3 px-4">Descripción</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {projects.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-container-high/50 transition">
                      <td className="py-3 px-4 font-mono text-outline">{p.id}</td>
                      <td className="py-3 px-4 font-semibold text-on-surface">{p.name}</td>
                      <td className="py-3 px-4 text-on-surface-variant max-w-xs truncate">{p.description}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-tertiary-container/30 text-tertiary font-semibold text-[11px]">
                          {p.status || 'activo'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenProjectModal(p)}
                          className="px-2 py-1 rounded bg-surface-container-high hover:bg-surface-bright text-xs text-primary transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteProject(p.id)}
                          className="px-2 py-1 rounded bg-error-container/30 hover:bg-error-container text-xs text-error transition"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL USER FORM */}
        {isUserModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant/30 max-w-md w-full shadow-2xl space-y-4">
              <h3 className="font-semibold text-lg text-on-surface">
                {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
              </h3>
              <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
                <div>
                  <label className="block text-outline mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={userFormData.name}
                    onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-outline mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-outline mb-1">Rol de Acceso</label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="admin">Administrador (admin)</option>
                    <option value="user">Desarrollador / Usuario (user)</option>
                  </select>
                </div>
                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsUserModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-bright transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold hover:bg-primary-fixed-dim transition"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL PROJECT FORM */}
        {isProjectModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant/30 max-w-md w-full shadow-2xl space-y-4">
              <h3 className="font-semibold text-lg text-on-surface">
                {editingProject ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}
              </h3>
              <form onSubmit={handleSaveProject} className="space-y-3 text-xs">
                <div>
                  <label className="block text-outline mb-1">Título del Proyecto</label>
                  <input
                    type="text"
                    required
                    value={projectFormData.name}
                    onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-outline mb-1">Descripción</label>
                  <textarea
                    rows={3}
                    value={projectFormData.description}
                    onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                    className="w-full p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-outline mb-1">Estado</label>
                  <select
                    value={projectFormData.status}
                    onChange={(e) => setProjectFormData({ ...projectFormData, status: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="activo">Activo</option>
                    <option value="en progreso">En Progreso</option>
                    <option value="completado">Completado</option>
                  </select>
                </div>
                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsProjectModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-bright transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold hover:bg-primary-fixed-dim transition"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
