import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext';

vi.mock('../../services/authService', () => ({
  authService: {
    getSession: vi.fn(),
    logout: vi.fn(),
  }
}));

import { authService } from '../../services/authService';

const TestComponent = () => {
  const { isAuthenticated, role, login, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="is-auth">{isAuthenticated.toString()}</div>
      <div data-testid="role">{role || 'none'}</div>
      <button onClick={() => login({ id: '1', email: 'test@test.com', role: 'admin' })}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    authService.getSession.mockResolvedValue(null);
    authService.logout.mockResolvedValue(undefined);
  });

  it('mantiene el estado por defecto (null) cuando no hay localStorage', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    expect(screen.getByTestId('is-auth').textContent).toBe('false');
    expect(screen.getByTestId('role').textContent).toBe('none');
  });

  it('ignora roles falsificados guardados en localStorage', async () => {
    localStorage.setItem('canvasai_user', JSON.stringify({ id: '2', role: 'dev' }));
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    expect(await screen.findByTestId('is-auth')).toHaveTextContent('false');
    expect(screen.getByTestId('role').textContent).toBe('none');
    expect(localStorage.getItem('canvasai_user')).toBeNull();
  });

  it('login() obtiene usuario y rol exclusivamente de la sesión backend', async () => {
    authService.getSession.mockResolvedValue({ id: 'server-id', email: 'test@test.com', role: 'user' });
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    await userEvent.click(screen.getByText('Login'));
    
    expect(screen.getByTestId('is-auth').textContent).toBe('true');
    expect(screen.getByTestId('role').textContent).toBe('user');
    expect(localStorage.getItem('canvasai_user')).toBeNull();
  });

  it('logout() invalida la sesión remota y limpia el estado', async () => {
    authService.getSession.mockResolvedValue({ id: '2', email: 'test@test.com', role: 'user' });
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    await userEvent.click(await screen.findByText('Logout'));
    
    expect(screen.getByTestId('is-auth').textContent).toBe('false');
    expect(localStorage.getItem('canvasai_user')).toBeNull();
    expect(authService.logout).toHaveBeenCalledOnce();
  });
});
