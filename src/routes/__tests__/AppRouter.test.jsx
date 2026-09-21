import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { AccessibilityProvider } from '../../context/AccessibilityContext';
import { AppRouter } from '../AppRouter';

describe('AppRouter Navigation & Protection', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('debe renderizar la vista pública de Login en la ruta raíz /', () => {
    render(
      <AccessibilityProvider>
        <AppRouter />
      </AccessibilityProvider>
    );

    expect(screen.getByRole('heading', { name: /CanvasAI/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Iniciar Sesión/i })).toBeInTheDocument();
  });
});
