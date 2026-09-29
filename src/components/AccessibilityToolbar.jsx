import React, { useState, useRef, useEffect } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';

const THEMES = [
  { id: 'midnight', label: 'Midnight', icon: 'dark_mode', color: '#3B82F6', badge: 'Azul' },
  { id: 'ps-classic', label: 'PS Classic', icon: 'stadia_controller', color: '#9EA4B1', badge: 'Gris' },
  { id: 'cosmic-blue', label: 'Cosmic Blue', icon: 'rocket_launch', color: '#38BDF8', badge: 'Cian' },
  { id: 'cyberpunk', label: 'Cyberpunk', icon: 'memory', color: '#FF007F', badge: 'Neón' },
  { id: 'matrix', label: 'Matrix', icon: 'terminal', color: '#00FF41', badge: 'Verde' },
  { id: 'oled', label: 'OLED Black', icon: 'contrast', color: '#E4E4E7', badge: 'Zinc' },
  { id: 'studio-light', label: 'Studio Light', icon: 'light_mode', color: '#2563EB', badge: 'Claro' },
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
          aria-expanded={isThemeOpen}
          title={`Tema activo: ${currentThemeObj.label}`}
          className="px-2.5 py-1.5 rounded-lg text-on-surface hover:bg-surface-container-high transition flex items-center justify-center gap-2 cursor-pointer border border-transparent hover:border-outline-variant/40"
        >
          <span
            className="w-2.5 h-2.5 rounded-full border border-outline-variant/80 shadow-sm"
            style={{ backgroundColor: currentThemeObj.color }}
          />
          <span className="material-symbols-outlined text-lg text-primary">
            {currentThemeObj.icon}
          </span>
          <span className="text-xs font-bold text-on-surface">{currentThemeObj.label}</span>
          <span
            className="material-symbols-outlined text-sm transition-transform duration-200"
            style={{ transform: isThemeOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            expand_more
          </span>
        </button>

        {isThemeOpen && (
          <div
            className="absolute top-full right-0 mt-2 w-56 bg-slate-900 border border-outline-variant/40 rounded-xl shadow-2xl overflow-hidden z-[1000] p-1.5 space-y-1 animate-fade-in"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <div className="px-2.5 py-1.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/20 mb-1 flex items-center justify-between">
              <span>Tema Visual</span>
              <span className="text-primary font-mono text-[10px]">Activo: {currentThemeObj.label}</span>
            </div>

            {THEMES.map((t) => {
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    document.documentElement.setAttribute('data-theme', t.id);
                    document.body.setAttribute('data-theme', t.id);
                    localStorage.setItem('canvasai_theme', t.id);
                    changeTheme(t.id);
                    setIsThemeOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition cursor-pointer ${
                    isSelected
                      ? 'bg-primary/20 text-on-surface font-bold ring-1 ring-primary/50'
                      : 'text-on-surface hover:bg-surface-container-high font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-outline-variant/60 shadow-inner shrink-0"
                      style={{ backgroundColor: t.color }}
                      title={`Paleta: ${t.badge}`}
                    />
                    <span className="material-symbols-outlined text-base text-primary shrink-0">
                      {t.icon}
                    </span>
                    <span className="text-on-surface">{t.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isSelected && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-primary text-black font-extrabold shadow-sm">
                        <span className="material-symbols-outlined text-xs text-black font-bold">check</span>
                        Activo
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
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
            ? 'bg-primary text-black font-bold shadow-sm'
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
