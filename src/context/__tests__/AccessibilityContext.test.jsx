import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { AccessibilityProvider, useAccessibility } from '../AccessibilityContext';

const TestComponent = () => {
  const {
    theme,
    toggleTheme,
    fontSizeLevel,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
  } = useAccessibility();

  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <span data-testid="font-value">{fontSizeLevel}</span>
      <button onClick={toggleTheme} data-testid="toggle-theme">Toggle Theme</button>
      <button onClick={increaseFontSize} data-testid="inc-font">Inc Font</button>
      <button onClick={decreaseFontSize} data-testid="dec-font">Dec Font</button>
      <button onClick={resetFontSize} data-testid="reset-font">Reset Font</button>
    </div>
  );
};

describe('AccessibilityContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('debe proporcionar valores iniciales predeterminados (tema oscuro y fuente normal)', () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    expect(screen.getByTestId('theme-value').textContent).toBe('dark');
    expect(screen.getByTestId('font-value').textContent).toBe('normal');
  });

  it('debe conmutar el tema de oscuro a claro y actualizar localStorage', () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    const toggleBtn = screen.getByTestId('toggle-theme');
    fireEvent.click(toggleBtn);

    expect(screen.getByTestId('theme-value').textContent).toBe('light');
    expect(localStorage.getItem('canvasai_theme')).toBe('light');
  });

  it('debe incrementar y restablecer el tamaño de la fuente', () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    const incBtn = screen.getByTestId('inc-font');
    fireEvent.click(incBtn);

    expect(screen.getByTestId('font-value').textContent).toBe('large');
    expect(localStorage.getItem('canvasai_fontSize')).toBe('large');

    const resetBtn = screen.getByTestId('reset-font');
    fireEvent.click(resetBtn);

    expect(screen.getByTestId('font-value').textContent).toBe('normal');
  });
});
