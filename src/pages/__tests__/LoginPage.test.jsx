import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { AccessibilityProvider } from '../../context/AccessibilityContext';
import { AuthProvider } from '../../context/AuthContext';
import { LoginPage } from '../LoginPage';

vi.mock('../../services/authService', () => ({
  authService: {
    getSession: vi.fn(),
    logout: vi.fn(),
    completeOAuthCallback: vi.fn(),
  },
}));

import { authService } from '../../services/authService';

const renderLoginPage = () => {
  return render(
    <AuthProvider>
      <AccessibilityProvider>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </AccessibilityProvider>
    </AuthProvider>
  );
};

describe('LoginPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authService.getSession.mockResolvedValue(null);
    authService.logout.mockResolvedValue(undefined);
    authService.completeOAuthCallback.mockResolvedValue({
      success: true,
      user: { id: 'oauth-user', role: 'user' },
    });
    sessionStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('debe renderizar CanvasAI y los proveedores OAuth institucionales', () => {
    renderLoginPage();

    expect(screen.getByRole('heading', { name: /CanvasAI/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Iniciar Sesión/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continuar con Google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continuar con GitHub/i })).toBeInTheDocument();
  });

  it('no debe exponer inputs de contraseña ni selector de roles en el cliente', () => {
    renderLoginPage();

    expect(screen.queryByLabelText(/contraseña/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/selecciona tu rol/i)).not.toBeInTheDocument();
  });

  it('debe exigir aceptación explícita de términos para autenticar', () => {
    renderLoginPage();

    expect(screen.getByRole('checkbox', { name: /he leído y acepto los términos y condiciones/i })).toBeInTheDocument();
    expect(screen.getByText(/cuentas de correo estándar verificadas/i)).toBeInTheDocument();
  });

  it('redirige al canvas cuando el callback OAuth se completa correctamente', async () => {
    const sessionUser = {
      id: 'oauth-user',
      role: 'user',
      termsAcceptedAt: '2026-10-04T00:00:00.000Z',
    };
    authService.getSession.mockResolvedValue(sessionUser);
    window.history.replaceState({}, '', '/login?code=one-time-code&state=oauth-state');

    render(
      <AuthProvider>
        <AccessibilityProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/canvas" element={<div>Área de trabajo</div>} />
            </Routes>
          </BrowserRouter>
        </AccessibilityProvider>
      </AuthProvider>
    );

    expect(await screen.findByText('Área de trabajo')).toBeInTheDocument();
    await waitFor(() => expect(authService.completeOAuthCallback).toHaveBeenCalledOnce());
  });

  it('redirige al panel de administración tras un callback OAuth de admin', async () => {
    const sessionUser = {
      id: 'admin-user',
      role: 'admin',
      termsAcceptedAt: '2026-10-04T00:00:00.000Z',
    };
    authService.getSession.mockResolvedValue(sessionUser);
    window.history.replaceState({}, '', '/login?code=one-time-code&state=oauth-state');

    render(
      <AuthProvider>
        <AccessibilityProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/admin" element={<div>Panel de administración</div>} />
            </Routes>
          </BrowserRouter>
        </AccessibilityProvider>
      </AuthProvider>
    );

    expect(await screen.findByText('Panel de administración')).toBeInTheDocument();
  });
});
