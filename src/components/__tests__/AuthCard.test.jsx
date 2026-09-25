import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AuthCard } from '../AuthCard';
import * as AuthContext from '../../context/AuthContext';
import { authService } from '../../services/authService';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
  }
}));

vi.mock('../../services/n8nService', () => ({
  n8nService: {
    sendUserRegistrationWebhook: vi.fn(),
  }
}));

describe('AuthCard', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ login: mockLogin });
  });

  it('renderiza el formulario de inicio de sesión correctamente', () => {
    render(<AuthCard />);
    expect(screen.getByText('Iniciar Sesión', { selector: 'h2' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('usuario@canvasai.fwd')).toBeInTheDocument();
  });

  it('ejecuta el submit, llama a authService y al contexto login()', async () => {
    const fakeUser = { id: '1', email: 'admin@canvasai.fwd', role: 'admin' };
    authService.login.mockResolvedValue({ success: true, user: fakeUser });

    render(<AuthCard />);
    
    // AuthCard pre-llena el formulario con admin@canvasai.fwd
    const submitBtn = screen.getByRole('button', { name: /ingresar a canvasai/i });
    
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('admin@canvasai.fwd', '123', 'admin');
    });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(fakeUser);
    });
  });
});
