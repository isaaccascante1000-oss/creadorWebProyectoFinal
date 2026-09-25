import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';
import ProtectedRoute from '../ProtectedRoute';
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
          <Route path="/" element={<div data-testid="public">Public Page</div>} />
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
          <Route path="/copilot" element={<div data-testid="copilot">Copilot Page</div>} />
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/protected" element={<div data-testid="protected">Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('copilot')).toBeInTheDocument();
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
  });
});
