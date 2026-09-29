import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import CanvasCopilotPage from '../pages/CanvasCopilotPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import TermsPage from '../pages/TermsPage';
import ProtectedRoute from '../components/ProtectedRoute';

export const AppRouter = () => {
  return (
    <HashRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/servicios" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/terms" element={<TermsPage />} />

        {/* Rutas Privadas solo para Administrador */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'Administrador']} />}>
          <Route path="/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Route>

        {/* Rutas Privadas para usuarios autenticados */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'user', 'dev', 'Administrador', 'Desarrollador']} />}>
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