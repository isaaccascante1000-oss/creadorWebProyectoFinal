import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { AccessibilityProvider } from '../../context/AccessibilityContext';
import { LoginPage } from '../LoginPage';

const renderLoginPage = () => {
  return render(
    <AccessibilityProvider>
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    </AccessibilityProvider>
  );
};

describe('LoginPage Component', () => {
  it('debe renderizar el título principal de CanvasAI y el formulario de autenticación', () => {
    renderLoginPage();

    expect(screen.getByRole('heading', { name: /CanvasAI/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Iniciar Sesión/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/usuario@canvasai.fwd/i)).toBeInTheDocument();
  });

  it('debe conmutar entre la pestaña de Iniciar Sesión y Crear Cuenta', () => {
    renderLoginPage();

    const registerTab = screen.getByRole('button', { name: /Crear Cuenta/i });
    fireEvent.click(registerTab);

    // Debe mostrar la etiqueta del campo Nombre Completo
    expect(screen.getByText(/Nombre Completo/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Isaac Andrés Cascante Linares/i)).toBeInTheDocument();
  });

  it('debe permitir escribir en el campo de correo electrónico y contraseña', () => {
    renderLoginPage();

    const emailInput = screen.getByPlaceholderText(/usuario@canvasai.fwd/i);
    fireEvent.change(emailInput, { target: { value: 'test@canvasai.fwd' } });
    expect(emailInput.value).toBe('test@canvasai.fwd');
  });
});
