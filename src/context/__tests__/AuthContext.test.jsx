import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AuthProvider, useAuth } from '../AuthContext';

vi.mock('../../services/authService', () => ({
  authService: {
    logout: vi.fn(),
  }
}));

const TestComponent = () => {
  const { user, isAuthenticated, role, login, logout } = useAuth();
  
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

  it('lee desde localStorage al iniciar', () => {
    localStorage.setItem('canvasai_user', JSON.stringify({ id: '2', role: 'dev' }));
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    expect(screen.getByTestId('is-auth').textContent).toBe('true');
    expect(screen.getByTestId('role').textContent).toBe('dev');
  });

  it('login() actualiza el estado y guarda canvasai_user en localStorage', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    await userEvent.click(screen.getByText('Login'));
    
    expect(screen.getByTestId('is-auth').textContent).toBe('true');
    expect(screen.getByTestId('role').textContent).toBe('admin');
    
    const stored = JSON.parse(localStorage.getItem('canvasai_user'));
    expect(stored.role).toBe('admin');
  });

  it('logout() limpia el estado y remueve canvasai_user de localStorage', async () => {
    localStorage.setItem('canvasai_user', JSON.stringify({ id: '2', role: 'dev' }));
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    await userEvent.click(screen.getByText('Logout'));
    
    expect(screen.getByTestId('is-auth').textContent).toBe('false');
    expect(localStorage.getItem('canvasai_user')).toBeNull();
  });
});
