import React from 'react';
import { CapabilityChips } from './CapabilityChips';

export const VisualStage = () => {
  return (
    <div className="lg:col-span-7 bg-surface-container-low p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
      {/* Subtle Vector Grid Backdrop */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#adc6ff_1px,transparent_1px)] [background-size:24px_24px]"></div>
      
      {/* Header: FWD Academy + Platform Identifier */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-on-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              terminal
            </span>
          </div>
          <div>
            <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">
              CanvasAI
            </h1>
            <p className="font-label-sm text-label-sm text-tertiary">
              FWD ACADEMY • EDICIÓN PRO
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/30 text-outline">
          <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">v2.4 Estación Activa</span>
        </div>
      </div>

      {/* Center Hero Description */}
      <div className="relative z-10 my-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-primary-container/20 text-primary font-label-md text-label-md mb-4 border border-primary-container/30">
          <span className="material-symbols-outlined text-base">auto_awesome</span>
          Lienzo de Generación Visual en Tiempo Real
        </div>
        <h2 className="font-headline-xl text-headline-xl text-on-surface mb-3 leading-tight">
          Diseña interfaces web dinámicas con la potencia de Gemini 1.5
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
          Convierte tus ideas, bocetos e instrucciones en componentes de React perfectamente estructurados y estilizados con Tailwind CSS.
        </p>

        {/* Live Copilot Visual Representation */}
        <div className="mt-6 p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between text-outline border-b border-surface-variant/50 pb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">magic_button</span>
              <span className="font-label-sm text-label-sm text-on-surface font-semibold">COPILOT PROMPT ENGINE</span>
            </div>
            <span className="font-label-sm text-label-sm text-tertiary">Fabric.js Stage Active</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Live Wireframe Card */}
            <div className="md:col-span-6 rounded-lg bg-surface-dim p-3 border border-outline-variant/30 flex flex-col justify-between min-h-[140px]">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-outline">COMPONENTE GENERADO</span>
                <span className="px-1.5 py-0.5 rounded bg-tertiary/20 text-tertiary font-label-sm text-[10px]">99.4% precisión</span>
              </div>
              <div className="my-2 space-y-2">
                <div className="h-4 w-3/4 bg-surface-variant rounded flex items-center px-2">
                  <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                  <div className="h-2 w-16 bg-surface-variant rounded"></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-10 rounded bg-primary-container/20 flex items-center justify-center">
                    <span className="font-label-sm text-label-sm text-primary">Botón A</span>
                  </div>
                  <div className="h-10 rounded bg-surface-container flex items-center justify-center">
                    <span className="font-label-sm text-label-sm text-outline">Input Field</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between font-label-sm text-label-sm text-tertiary">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">photo_camera</span> 640x360 PNG
                </span>
                <span>99.4% confianza</span>
              </div>
            </div>

            {/* Output Synthesized React Code */}
            <div className="md:col-span-6 rounded-lg bg-surface-dim p-3 flex flex-col justify-between min-h-[140px]">
              <div className="flex items-center justify-between text-outline">
                <span className="font-label-sm text-label-sm">SÍNTESIS JSX + TAILWIND</span>
                <span className="material-symbols-outlined text-xs text-tertiary">code</span>
              </div>
              <pre className="font-label-sm text-label-sm text-secondary leading-tight mt-1 overflow-x-hidden">
                <span className="text-primary">&lt;div</span> <span className="text-outline">className=</span><span className="text-tertiary-fixed">"flex gap-4 p-4"</span><span className="text-primary">&gt;</span>{'\n'}
                {'  '}<span className="text-primary">&lt;Button</span> <span className="text-outline">variant=</span><span className="text-tertiary-fixed">"primary"</span><span className="text-primary">&gt;</span>Acción<span className="text-primary">&lt;/Button&gt;</span>{'\n'}
                {'  '}<span className="text-primary">&lt;Input</span> <span className="text-outline">placeholder=</span><span className="text-tertiary-fixed">"Escribe..."</span> <span className="text-primary">/&gt;</span>{'\n'}
                <span className="text-primary">&lt;/div&gt;</span>
              </pre>
              <div className="flex items-center gap-2 mt-2">
                <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-tertiary-container/30 text-tertiary">
                  Render 0.8s
                </span>
                <span className="font-label-sm text-label-sm text-outline">0 Errores sintácticos</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Capability Chips Footer */}
      <CapabilityChips />
    </div>
  );
};
