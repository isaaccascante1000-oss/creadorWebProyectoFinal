import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute, { PublicOnlyRoute } from '../ProtectedRoute';
import * as AuthContext from '../../context/AuthContext';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('ProtectedRoute', () => {
  it('redirige a / cuando el usuario no está autenticado', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ isAuthenticated: false, role: null });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div data-testid="public">Public Page</div>} />
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/protected" element={<div data-testid="protected">Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('public')).toBeInTheDocument();
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
  });

  it('renderiza children cuando está autenticado y cumple con el rol', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ isAuthenticated: true, role: 'admin' });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/protected" element={<div data-testid="protected">Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected')).toBeInTheDocument();
  });
  
  it('redirige si está autenticado pero no tiene el rol permitido', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ isAuthenticated: true, role: 'user' });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/canvas" element={<div data-testid="copilot">Copilot Page</div>} />
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/protected" element={<div data-testid="protected">Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('copilot')).toBeInTheDocument();
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
  });

  it('redirige desde una ruta pública al Dashboard cuando ya hay sesión', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      role: 'user',
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<PublicOnlyRoute><div>Landing pública</div></PublicOnlyRoute>} />
          <Route path="/dashboard" element={<div data-testid="dashboard">Dashboard</div>} />
          <Route path="/canvas" element={<div data-testid="copilot">Área de trabajo</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('copilot')).not.toBeInTheDocument();
    expect(screen.queryByText('Landing pública')).not.toBeInTheDocument();
  });

  it('prioriza el Dashboard sobre el destino previo para usuarios autenticados', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      role: 'user',
    });

    render(
      <MemoryRouter initialEntries={[{
        pathname: '/login',
        state: { from: { pathname: '/requested', search: '?tab=recent', hash: '#item' } },
      }]}>
        <Routes>
          <Route path="/login" element={<PublicOnlyRoute><div>Login</div></PublicOnlyRoute>} />
          <Route path="/dashboard" element={<div data-testid="dashboard">Dashboard</div>} />
          <Route path="/requested" element={<div data-testid="requested">Ruta solicitada</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('requested')).not.toBeInTheDocument();
  });
});
