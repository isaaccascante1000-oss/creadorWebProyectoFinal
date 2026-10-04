import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import CanvasCopilotPage from '../pages/CanvasCopilotPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import TermsPage from '../pages/TermsPage';
import ProtectedRoute, { PublicOnlyRoute } from '../components/ProtectedRoute';

const OAuthCallbackRedirect = () => {
  const location = useLocation();
  const callbackSearch = location.search || window.location.search;
  const params = new URLSearchParams(callbackSearch);
  if (params.has('code') || params.has('error')) {
    return <Navigate to={{ pathname: '/login', search: callbackSearch }} replace />;
  }
  return (
    <PublicOnlyRoute>
      <LandingPage />
    </PublicOnlyRoute>
  );
};

export const AppRouter = () => {
  return (
    <HashRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<OAuthCallbackRedirect />} />
        <Route path="/servicios" element={<PublicOnlyRoute><LandingPage /></PublicOnlyRoute>} />
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/terms" element={<TermsPage />} />

        {/* Rutas Privadas solo para Administrador */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'Administrador', 'ADMIN']} />}>
          <Route path="/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Route>

        {/* Rutas Privadas para usuarios autenticados */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'user', 'dev', 'Administrador', 'Desarrollador', 'ADMIN', 'DEV', 'USER']} />}>
          <Route path="/copilot" element={<CanvasCopilotPage />} />
          <Route path="/canvas" element={<CanvasCopilotPage />} />
        </Route>

        {/* Ruta comodín por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default AppRouter;