import React, { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext();

export const AccessibilityProvider = ({ children }) => {
  // Inicializa tema desde localStorage o por defecto 'midnight'
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('canvasai_theme');
    return savedTheme ? savedTheme : 'midnight';
  });

  // Inicializa nivel de fuente: 'normal' (100%), 'large' (115%), 'xlarge' (130%)
  const [fontSizeLevel, setFontSizeLevel] = useState(() => {
    const savedFontSize = localStorage.getItem('canvasai_fontSize');
    return savedFontSize ? savedFontSize : 'normal';
  });

  // Efecto para aplicar tema en el document y persistir en localStorage
  useEffect(() => {
    localStorage.setItem('canvasai_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    
    // Mantenemos dark para tailwind legacy en fondos oscuros
    const darkThemes = ['midnight', 'cosmic-blue', 'cyberpunk', 'matrix', 'oled', 'dark'];
    if (darkThemes.includes(theme)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Efecto para actualizar el tamaño de fuente global en el documentElement y persistir
  useEffect(() => {
    localStorage.setItem('canvasai_fontSize', fontSizeLevel);
    let scalePercentage = '100%';
    if (fontSizeLevel === 'large') scalePercentage = '115%';
    if (fontSizeLevel === 'xlarge') scalePercentage = '130%';

    document.documentElement.style.fontSize = scalePercentage;
  }, [fontSizeLevel]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'midnight' ? 'studio-light' : 'midnight'));
  };

  const increaseFontSize = () => {
    setFontSizeLevel((prev) => {
      if (prev === 'normal') return 'large';
      if (prev === 'large') return 'xlarge';
      return 'xlarge';
    });
  };

  const decreaseFontSize = () => {
    setFontSizeLevel((prev) => {
      if (prev === 'xlarge') return 'large';
      if (prev === 'large') return 'normal';
      return 'normal';
    });
  };

  const resetFontSize = () => {
    setFontSizeLevel('normal');
  };

  return (
    <AccessibilityContext.Provider
      value={{
        theme,
        setTheme,
        changeTheme,
        toggleTheme,
        fontSizeLevel,
        increaseFontSize,
        decreaseFontSize,
        resetFontSize,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility debe usarse dentro de un AccessibilityProvider');
  }
  return context;
};

export default AccessibilityContext;
