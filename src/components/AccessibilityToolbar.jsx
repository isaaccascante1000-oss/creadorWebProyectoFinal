import React from 'react';
import { useAccessibility } from '../context/AccessibilityContext';

export const AccessibilityToolbar = ({ className = '' }) => {
  const {
    theme,
    toggleTheme,
    fontSizeLevel,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
  } = useAccessibility();

  return (
    <div
      role="region"
      aria-label="Herramientas de accesibilidad visual"
      className={`inline-flex items-center gap-1.5 p-1.5 rounded-xl bg-surface-container-highest/90 border border-outline-variant/30 shadow-lg backdrop-blur-md ${className}`}
    >
      {/* Botón Cambiar Tema */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`Cambiar a tema ${theme === 'dark' ? 'claro' : 'oscuro'}`}
        title={`Tema actual: ${theme === 'dark' ? 'Oscuro' : 'Claro'}`}
        className="p-1.5 rounded-lg text-on-surface hover:bg-surface-container-high transition flex items-center justify-center cursor-pointer"
      >
        <span className="material-symbols-outlined text-lg text-primary">
          {theme === 'dark' ? 'light_mode' : 'dark_mode'}
        </span>
      </button>

      <div className="w-px h-4 bg-outline-variant/40 mx-0.5"></div>

      {/* Disminuir tamaño de fuente */}
      <button
        type="button"
        onClick={decreaseFontSize}
        disabled={fontSizeLevel === 'normal'}
        aria-label="Disminuir tamaño de texto de la aplicación"
        title="Disminuir texto"
        className="px-2 py-1 rounded-lg text-xs font-bold text-on-surface hover:bg-surface-container-high transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        A-
      </button>

      {/* Restablecer tamaño de fuente */}
      <button
        type="button"
        onClick={resetFontSize}
        aria-label="Restablecer tamaño de texto normal (100%)"
        title={`Tamaño actual: ${fontSizeLevel}`}
        className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
          fontSizeLevel === 'normal'
            ? 'bg-primary text-on-primary shadow-sm'
            : 'text-on-surface hover:bg-surface-container-high'
        }`}
      >
        A
      </button>

      {/* Aumentar tamaño de fuente */}
      <button
        type="button"
        onClick={increaseFontSize}
        disabled={fontSizeLevel === 'xlarge'}
        aria-label="Aumentar tamaño de texto de la aplicación"
        title="Aumentar texto"
        className="px-2 py-1 rounded-lg text-xs font-bold text-on-surface hover:bg-surface-container-high transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        A+
      </button>
    </div>
  );
};

export default AccessibilityToolbar;
