import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import CanvasCopilotPage from '../pages/CanvasCopilotPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import ProtectedRoute from '../components/ProtectedRoute';
import LandingPage from '../pages/LandingPage';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Publicas */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas Privadas solo para Administrador */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Route>

        {/* Rutas Privadas para todos los usuarios autenticados */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'user', 'dev']} />}>
          <Route path="/copilot" element={<CanvasCopilotPage />} />
          <Route path="/canvas" element={<CanvasCopilotPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

