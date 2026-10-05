import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    requestEmailCode: vi.fn(),
    verifyEmailCode: vi.fn(),
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
    authService.requestEmailCode.mockResolvedValue({ success: true });
    authService.verifyEmailCode.mockResolvedValue({ success: true });
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
    expect(screen.getByText(/código enviado por correo/i)).toBeInTheDocument();
  });

  it('recarga la sesión antes de redirigir por OTP al Dashboard', async () => {
    const user = userEvent.setup();
    const sessionUser = {
      id: 'email-user',
      role: 'user',
      termsAcceptedAt: '2026-10-05T00:00:00.000Z',
    };
    authService.getSession.mockResolvedValueOnce(null).mockResolvedValueOnce(sessionUser);
    window.history.replaceState({}, '', '/login');

    render(
      <AuthProvider>
        <AccessibilityProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<div>Dashboard de proyectos</div>} />
              <Route path="/canvas" element={<div>Editor Canvas</div>} />
            </Routes>
          </BrowserRouter>
        </AccessibilityProvider>
      </AuthProvider>
    );

    await user.click(screen.getByRole('checkbox', { name: /he leído y acepto/i }));
    await user.type(screen.getByLabelText(/correo electrónico/i), 'persona@example.com');
    await user.click(screen.getByRole('button', { name: /continuar con correo/i }));
    await user.type(await screen.findByLabelText(/código de verificación/i), '123456');
    await user.click(screen.getByRole('button', { name: /verificar código/i }));

    expect(await screen.findByText('Dashboard de proyectos')).toBeInTheDocument();
    expect(screen.queryByText('Editor Canvas')).not.toBeInTheDocument();
    expect(authService.getSession).toHaveBeenCalledTimes(2);
  });

  it('redirige al Dashboard cuando el callback OAuth se completa correctamente', async () => {
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
              <Route path="/dashboard" element={<div>Dashboard</div>} />
            </Routes>
          </BrowserRouter>
        </AccessibilityProvider>
      </AuthProvider>
    );

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
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
              <Route path="/dashboard" element={<div>Dashboard de administración</div>} />
            </Routes>
          </BrowserRouter>
        </AccessibilityProvider>
      </AuthProvider>
    );

    expect(await screen.findByText('Dashboard de administración')).toBeInTheDocument();
  });
});
