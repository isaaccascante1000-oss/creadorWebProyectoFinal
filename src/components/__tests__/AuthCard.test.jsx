import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthCard } from '../AuthCard';
import { authService } from '../../services/authService';

vi.mock('../../services/authService', () => ({
  authService: {
    startOAuth: vi.fn(),
  }
}));

describe('AuthCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authService.startOAuth.mockReturnValue({ success: true });
  });

  it('exige aceptar términos antes de habilitar proveedores OAuth', async () => {
    render(<AuthCard />);
    expect(screen.getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument();
    const googleButton = screen.getByRole('button', { name: /continuar con google/i });
    const githubButton = screen.getByRole('button', { name: /continuar con github/i });
    expect(googleButton).toBeDisabled();
    expect(githubButton).toBeDisabled();
    expect(screen.queryByLabelText(/contraseña/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/selecciona tu rol/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('checkbox', { name: /he leído y acepto/i }));
    expect(googleButton).toBeEnabled();
    expect(githubButton).toBeEnabled();
    await userEvent.click(googleButton);
    expect(authService.startOAuth).toHaveBeenCalledWith('google', true);
  });
});
