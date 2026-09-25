import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { AccessibilityProvider } from '../../context/AccessibilityContext';
import { AuthProvider } from '../../context/AuthContext';
import { AppRouter } from '../AppRouter';

describe('AppRouter Navigation & Protection', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('debe renderizar la landing publica en la ruta raiz /', () => {
    render(
      <AuthProvider>
        <AccessibilityProvider>
          <AppRouter />
        </AccessibilityProvider>
      </AuthProvider>
    );

    expect(screen.getByRole('heading', { name: /Dale un lugar a tus mejores ideas/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Iniciar sesion/i })).toBeInTheDocument();
  });
});
