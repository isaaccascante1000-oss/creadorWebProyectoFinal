import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AccessibilityToolbar } from '../components/AccessibilityToolbar';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import AdminDashboardPage from './AdminDashboardPage';

export const DashboardPage = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const isAdmin = ['admin', 'administrador'].includes(String(auth.role || '').toLowerCase());

  useEffect(() => {
    if (isAdmin) return undefined;
    let active = true;

    apiService.getProjects()
      .then((result) => {
        if (active) setProjects(Array.isArray(result) ? result : []);
      })
      .catch(() => {
        if (active) setHasError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [isAdmin, reloadKey]);

  const handleLogout = async () => {
    await auth.logout();
    navigate('/login', { replace: true });
  };

  if (isAdmin) return <AdminDashboardPage />;

  return (
    <main className="min-h-screen bg-surface text-on-surface">
      <header className="flex min-h-16 items-center justify-between gap-4 border-b border-outline-variant/30 bg-surface-container-low px-5 sm:px-8">
        <Link to="/dashboard" className="flex items-center gap-3 font-semibold">
          <span className="material-symbols-outlined text-primary">dashboard</span>
          CanvasAI Studio
        </Link>
        <div className="flex items-center gap-3">
          <AccessibilityToolbar />
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-outline-variant/40 px-3 py-2 text-sm font-semibold transition hover:bg-surface-container-high"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-outline-variant/30 pb-6">
          <div>
            <p className="text-sm font-semibold text-primary">Espacio de trabajo</p>
            <h1 className="mt-1 text-3xl font-bold">Tus proyectos</h1>
          </div>
          <Link
            to="/canvas"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 font-semibold text-on-primary transition hover:brightness-105"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Crear proyecto
          </Link>
        </div>

        {loading ? (
          <p className="py-12 text-sm text-on-surface-variant" role="status">Cargando proyectos...</p>
        ) : hasError ? (
          <div className="py-12" role="alert">
            <p className="text-sm text-error">No se pudieron cargar los proyectos.</p>
            <button
              type="button"
              onClick={() => { setHasError(false); setLoading(true); setReloadKey((value) => value + 1); }}
              className="mt-3 text-sm font-semibold text-primary hover:underline"
            >
              Reintentar
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div className="border-b border-outline-variant/20 py-12">
            <h2 className="text-lg font-semibold">Todavía no tienes proyectos</h2>
            <p className="mt-2 text-sm text-on-surface-variant">Crea un proyecto para empezar a diseñar en CanvasAI.</p>
          </div>
        ) : (
          <ul className="divide-y divide-outline-variant/20" aria-label="Lista de proyectos">
            {projects.map((project) => (
              <li key={project.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
                <div className="min-w-0">
                  <h2 className="truncate font-semibold">{project.name}</h2>
                  {project.description && <p className="mt-1 line-clamp-2 text-sm text-on-surface-variant">{project.description}</p>}
                  <p className="mt-2 text-xs text-on-surface-variant">{project.status || 'activo'}</p>
                </div>
                <Link to="/canvas" className="text-sm font-semibold text-primary hover:underline">Abrir editor</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
};

export default DashboardPage;