import React, { useEffect } from 'react';

export const TermsModal = ({ isOpen, onClose }) => {
  // Bloquear el scroll del body y permitir cerrar con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 transition-opacity animate-fade-in"
      onClick={onClose}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-terms-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl text-slate-200 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-emerald-400 text-xl">gavel</span>
            <h2 id="modal-terms-title" className="text-xl font-bold text-slate-100">
              Términos y Condiciones de Uso
            </h2>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 text-2xl font-bold px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            &times;
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm leading-relaxed text-slate-300">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Última actualización: Septiembre 2026
          </div>
          
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/70">
              <h3 className="text-base font-semibold text-slate-100 mb-1">
                1. Aceptación del Servicio
              </h3>
              <p className="text-slate-300">
                Al acceder y utilizar CanvasAI, el usuario manifiesta su conformidad con los presentes términos y directrices técnicas de uso de la plataforma.
              </p>
            </div>
            
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/70">
              <h3 className="text-base font-semibold text-slate-100 mb-1">
                2. Privacidad y Datos de Usuario
              </h3>
              <p className="text-slate-300">
                Los datos registrados y proyectos creados son procesados de forma local controlada a través de persistencia simulada (<code className="text-xs bg-slate-800 px-1.5 py-0.5 rounded text-emerald-300">db.json</code>) y servicios internos para fines académicos y demostrativos.
              </p>
            </div>
            
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/70">
              <h3 className="text-base font-semibold text-slate-100 mb-1">
                3. Asistencia por Inteligencia Artificial
              </h3>
              <p className="text-slate-300">
                Las sugerencias y código generados por las herramientas de IA tienen propósito orientativo para potenciar la productividad y el aprendizaje en desarrollo web moderno.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/40 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/15 cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;