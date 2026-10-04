import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    localStorage.removeItem('canvasai_user');
    let active = true;
    authService.getSession().then((sessionUser) => {
      if (active) {
        setUser(sessionUser);
        setIsLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  const isAuthenticated = !!user;
  const role = user?.role ?? null;

  const login = useCallback(async () => {
    const sessionUser = await authService.getSession();
    setUser(sessionUser);
    return sessionUser;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, role, login, logout }}>
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
