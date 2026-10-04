import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccessibilityProvider } from '../../context/AccessibilityContext';
import { AuthProvider } from '../../context/AuthContext';
import { AppRouter } from '../AppRouter';

vi.mock('../../services/authService', () => ({
  authService: {
    getSession: vi.fn(),
    logout: vi.fn(),
    completeOAuthCallback: vi.fn(),
  },
}));

vi.mock('../../pages/CanvasCopilotPage', () => ({
  default: () => <div>Área de trabajo</div>,
}));

vi.mock('../../pages/AdminDashboardPage', () => ({
  default: () => <div>Panel de Administración</div>,
}));

import { authService } from '../../services/authService';

describe('AppRouter Navigation & Protection', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = '#/';
    window.history.replaceState({}, '', '/');
    vi.clearAllMocks();
    authService.getSession.mockResolvedValue(null);
    authService.logout.mockResolvedValue(undefined);
    authService.completeOAuthCallback.mockResolvedValue({
      success: true,
      user: { id: 'oauth-user', role: 'user' },
    });
  });

  it('debe renderizar la landing publica en la ruta raiz /', async () => {
    render(
      <AuthProvider>
        <AccessibilityProvider>
          <AppRouter />
        </AccessibilityProvider>
      </AuthProvider>
    );

    expect(await screen.findByRole('heading', { name: /Dale un lugar a tus mejores ideas/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Iniciar sesion/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /A que nos dedicamos/i })).toBeInTheDocument();
  });

  it('debe renderizar la sección de términos y condiciones sin pantallas blancas', async () => {
    window.location.hash = '#/terms';
    render(
      <AuthProvider>
        <AccessibilityProvider>
          <AppRouter />
        </AccessibilityProvider>
      </AuthProvider>
    );

    expect(await screen.findByText(/Términos, Condiciones y Privacidad/i)).toBeInTheDocument();
    window.location.hash = '#/';
  });

  it('redirige un usuario autenticado desde la Landing Page al canvas', async () => {
    authService.getSession.mockResolvedValue({
      id: 'user',
      role: 'user',
    });

    render(
      <AuthProvider>
        <AccessibilityProvider>
          <AppRouter />
        </AccessibilityProvider>
      </AuthProvider>
    );

    expect(await screen.findByText('Área de trabajo')).toBeInTheDocument();
  });

  it('redirige un administrador autenticado desde /login al panel', async () => {
    window.location.hash = '#/login';
    authService.getSession.mockResolvedValue({
      id: 'admin',
      role: 'admin',
    });

    render(
      <AuthProvider>
        <AccessibilityProvider>
          <AppRouter />
        </AccessibilityProvider>
      </AuthProvider>
    );

    expect(await screen.findByText('Panel de Administración')).toBeInTheDocument();
  });

  it('envía un callback OAuth antiguo de /login al flujo de autenticación', async () => {
    const sessionUser = {
      id: 'oauth-user',
      role: 'user',
      termsAcceptedAt: '2026-10-04T00:00:00.000Z',
    };
    authService.getSession.mockResolvedValueOnce(null).mockResolvedValueOnce(sessionUser);
    window.history.replaceState({}, '', '/login?code=one-time-code&state=oauth-state');
    window.location.hash = '';

    render(
      <AuthProvider>
        <AccessibilityProvider>
          <AppRouter />
        </AccessibilityProvider>
      </AuthProvider>
    );

    expect(await screen.findByText('Área de trabajo')).toBeInTheDocument();
    expect(authService.completeOAuthCallback).toHaveBeenCalledOnce();
  });
});
