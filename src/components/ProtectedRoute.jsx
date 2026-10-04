import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAuthenticatedHome } from '../utils/authNavigation';

export const PublicOnlyRoute = ({ children }) => {
  const auth = useAuth();
  const location = useLocation();

  if (auth?.isLoading) return null;
  if (!auth?.isAuthenticated && !auth?.user) return children;

  const from = location.state?.from;
  const target = from?.pathname
    ? { pathname: from.pathname, search: from.search || '', hash: from.hash || '' }
    : getAuthenticatedHome(auth?.role || auth?.user?.role || auth?.user?.type);

  return <Navigate to={target} replace />;
};

export const ProtectedRoute = ({ allowedRoles }) => {
  const auth = useAuth();
  const location = useLocation();

  if (auth?.isLoading) return null;

  // Soporta si useAuth devuelve 'isAuthenticated' directamente o evalúa la existencia de 'user'
  const isAuthenticated = auth?.isAuthenticated ?? Boolean(auth?.user);

  // Extrae el rol normalizado a minúsculas para comparaciones case-insensitive
  // Soporta variantes: 'admin', 'ADMIN', 'Administrador', 'user', 'dev', etc.
  const rawRole = auth?.role || auth?.user?.role || auth?.user?.type || '';
  const currentRole = String(rawRole).toLowerCase();

  // 1. Si no está autenticado, redirigir explícitamente al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 2. Validación de permisos por rol (comparación normalizada)
  if (allowedRoles && allowedRoles.length > 0) {
    const hasPermission = allowedRoles.some(
      (r) => String(r).toLowerCase() === currentRole
    );

    if (!hasPermission) {
      // IMPORTANTE: No redirigir a una ruta también protegida para evitar bucles.
      // Usuarios con rol user/dev → van al canvas (su área autorizada).
      // Cualquier otro rol sin permiso → redirige a la raíz (landing page segura).
      if (['user', 'dev', 'desarrollador'].includes(currentRole)) {
        return <Navigate to="/canvas" replace />;
      }
      // Redirigir a home (/) en lugar de /dashboard para cortar posibles bucles de redirección
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;