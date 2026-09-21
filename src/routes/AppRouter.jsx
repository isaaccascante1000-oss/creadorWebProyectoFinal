import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import CanvasCopilotPage from '../pages/CanvasCopilotPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import ProtectedRoute from '../components/ProtectedRoute';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Pública */}
        <Route path="/" element={<LoginPage />} />

        {/* Rutas Privadas solo para Administrador */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Route>

        {/* Rutas Privadas para todos los usuarios autenticados */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'user', 'dev']} />}>
          <Route path="/copilot" element={<CanvasCopilotPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
