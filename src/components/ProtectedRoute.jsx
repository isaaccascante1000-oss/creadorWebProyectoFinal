import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../services/authService';

export const ProtectedRoute = ({ allowedRoles }) => {
  const isAuth = authService.isAuthenticated();
  const userRole = authService.getUserRole();

  if (!isAuth) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Redirige al destino apropiado según el rol si no tiene permiso para la ruta actual
    if (userRole === 'user' || userRole === 'dev') {
      return <Navigate to="/copilot" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
