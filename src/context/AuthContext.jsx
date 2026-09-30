import React, { createContext, useContext, useState } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

/**
 * Intenta parsear el usuario guardado en localStorage de forma segura.
 * Si el valor está corrupto, incompleto o no es un objeto válido con email/role,
 * limpia el storage y retorna null para forzar el estado no-autenticado.
 */
const getSafeStoredUser = () => {
  try {
    const raw = localStorage.getItem('canvasai_user');
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // Validar que sea un objeto con campos mínimos esperados
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed) ||
      !parsed.email
    ) {
      console.warn('[AuthContext] Datos de sesión inválidos en localStorage. Limpiando...');
      localStorage.removeItem('canvasai_user');
      return null;
    }

    return parsed;
  } catch (err) {
    console.warn('[AuthContext] Error al parsear sesión de localStorage. Limpiando...', err);
    localStorage.removeItem('canvasai_user');
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getSafeStoredUser);

  const isAuthenticated = !!user;
  const role = user?.role ?? null;

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('canvasai_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('canvasai_user');
    authService.logout();
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
