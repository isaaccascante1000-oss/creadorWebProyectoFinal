import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorBoundary } from '../ErrorBoundary';

const ProblemChild = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Error simulado en componente hijo');
  }
  return <div>Componente renderizado correctamente</div>;
};

describe('ErrorBoundary Component', () => {
  // Silenciamos los console.error esperados durante el test de error
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  afterEach(() => {
    console.error = originalError;
  });

  it('debe renderizar a sus hijos normalmente cuando no hay error', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Componente renderizado correctamente')).toBeInTheDocument();
  });

  it('debe capturar el error y mostrar la interfaz fallback en lugar de una pantalla blanca', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
    expect(screen.getByText(/Error simulado en componente hijo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reintentar vista/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ir al Inicio/i })).toBeInTheDocument();
  });
});
