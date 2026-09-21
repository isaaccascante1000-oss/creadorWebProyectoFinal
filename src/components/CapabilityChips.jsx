import React from 'react';

export const CapabilityChips = () => {
  return (
    <div className="relative z-10 pt-4 flex flex-wrap gap-2">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant font-label-sm text-label-sm shadow-sm">
        <span className="material-symbols-outlined text-base text-primary">psychology</span>
        <span>Multimodal Gemini 1.5 Pro</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant font-label-sm text-label-sm shadow-sm">
        <span className="material-symbols-outlined text-base text-tertiary">javascript</span>
        <span>Exportación React + Tailwind</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant font-label-sm text-label-sm shadow-sm">
        <span className="material-symbols-outlined text-base text-secondary">hub</span>
        <span>Automatización N8N Workflows</span>
      </div>
    </div>
  );
};
