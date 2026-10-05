import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthCard } from '../AuthCard';
import { authService } from '../../services/authService';

vi.mock('../../services/authService', () => ({
  authService: {
    startOAuth: vi.fn(),
    requestEmailCode: vi.fn(),
    verifyEmailCode: vi.fn(),
  }
}));

describe('AuthCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authService.startOAuth.mockReturnValue({ success: true });
    authService.requestEmailCode.mockResolvedValue({ success: true });
    authService.verifyEmailCode.mockResolvedValue({ success: true });
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

  it('solicita un código por correo y verifica el código recibido', async () => {
    const onEmailVerified = vi.fn();
    render(<AuthCard onEmailVerified={onEmailVerified} />);

    await userEvent.click(screen.getByRole('checkbox', { name: /he leído y acepto/i }));
    await userEvent.type(screen.getByLabelText(/correo electrónico/i), 'persona@example.com');
    await userEvent.click(screen.getByRole('button', { name: /continuar con correo/i }));

    expect(authService.requestEmailCode).toHaveBeenCalledWith('persona@example.com');
    expect(await screen.findByLabelText(/código de verificación/i)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/código de verificación/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /verificar código/i }));

    expect(authService.verifyEmailCode).toHaveBeenCalledWith('persona@example.com', '123456');
    expect(onEmailVerified).toHaveBeenCalledOnce();
  });

  it('muestra el error si falla el envío del código', async () => {
    const onShowToast = vi.fn();
    authService.requestEmailCode.mockResolvedValue({ success: false, error: 'Webhook no disponible.' });
    render(<AuthCard onShowToast={onShowToast} />);

    await userEvent.click(screen.getByRole('checkbox', { name: /he leído y acepto/i }));
    await userEvent.type(screen.getByLabelText(/correo electrónico/i), 'persona@example.com');
    await userEvent.click(screen.getByRole('button', { name: /continuar con correo/i }));

    expect(onShowToast).toHaveBeenCalledWith('Webhook no disponible.', 'error');
  });
});
