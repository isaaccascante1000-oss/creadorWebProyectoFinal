import React, { useState, useRef, useEffect } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';

const THEMES = [
  { id: 'midnight', label: 'Midnight', icon: 'dark_mode', color: '#0F172A' },
  { id: 'ps-classic', label: 'PS Classic', icon: 'stadia_controller', color: '#E6E6E6' },
  { id: 'cosmic-blue', label: 'Cosmic Blue', icon: 'rocket_launch', color: '#04091A' },
  { id: 'cyberpunk', label: 'Cyberpunk', icon: 'memory', color: '#0B0014' },
  { id: 'matrix', label: 'Matrix', icon: 'terminal', color: '#000000' },
  { id: 'oled', label: 'OLED Black', icon: 'contrast', color: '#000000' },
  { id: 'studio-light', label: 'Studio Light', icon: 'light_mode', color: '#FFFFFF' },
];

export const AccessibilityToolbar = ({ className = '' }) => {
  const {
    theme,
    changeTheme,
    fontSizeLevel,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
  } = useAccessibility();

  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsThemeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentThemeObj = THEMES.find((t) => t.id === theme) || THEMES[0];

  return (
    <div
      role="region"
      aria-label="Herramientas de accesibilidad visual"
      className={`inline-flex items-center gap-1.5 p-1.5 rounded-xl bg-surface-container-highest/90 border border-outline-variant/30 shadow-lg backdrop-blur-md ${className}`}
    >
      {/* Botón Cambiar Tema */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsThemeOpen(!isThemeOpen)}
          aria-label="Seleccionar tema"
          title={`Tema actual: ${currentThemeObj.label}`}
          className="px-2 py-1.5 rounded-lg text-on-surface hover:bg-surface-container-high transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg text-primary">
            {currentThemeObj.icon}
          </span>
          <span className="text-xs font-semibold">{currentThemeObj.label}</span>
          <span className="material-symbols-outlined text-sm transition-transform duration-200" style={{ transform: isThemeOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
        </button>

        {isThemeOpen && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 border border-outline-variant/30 rounded-xl shadow-xl overflow-hidden z-[1000]" style={{ backgroundColor: 'var(--card-bg)' }}>
            <div className="p-2 space-y-1">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    document.documentElement.setAttribute('data-theme', t.id);
                    document.body.setAttribute('data-theme', t.id);
                    localStorage.setItem('canvasai_theme', t.id);
                    changeTheme(t.id);
                    setIsThemeOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    theme === t.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">
                      {t.icon}
                    </span>
                    <span>{t.label}</span>
                  </div>
                  <div
                    className="w-3 h-3 rounded-full border border-outline-variant/50"
                    style={{ backgroundColor: t.color }}
                  ></div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

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
