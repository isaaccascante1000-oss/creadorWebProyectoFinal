import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AccessibilityToolbar } from '../components/AccessibilityToolbar';

export const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 transition-colors duration-200">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header con botón Volver y Barra de Accesibilidad */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-emerald-400 rounded-xl text-sm font-semibold transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            <span>Volver</span>
          </button>
          
          <AccessibilityToolbar />
        </div>

        {/* Tarjeta Principal de Términos */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-8 sm:p-10 shadow-2xl backdrop-blur-md">
          {/* Badge & Título */}
          <div className="mb-8 border-b border-slate-800/70 pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Documentación Oficial CanvasAI • Edición 2026
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight">
              Términos, Condiciones y Privacidad
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Marco de uso responsable, políticas de seguridad y lineamientos de acceso para el estudio creativo.
            </p>
          </div>
          
          {/* Secciones con alto contraste y tonalidades suaves */}
          <div className="space-y-8 text-slate-300 leading-relaxed text-sm sm:text-base">
            <section className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-5 sm:p-6 transition hover:border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  01
                </span>
                <h2 className="text-lg sm:text-xl font-semibold text-slate-100">
                  Términos Generales del Servicio
                </h2>
              </div>
              <p className="text-slate-300 pl-11">
                Bienvenido a <strong className="text-slate-100 font-semibold">CanvasAI</strong>. Al utilizar nuestro estudio creativo aumentado, usted acepta someterse a las presentes condiciones. La plataforma proporciona herramientas asistidas para acelerar la concepción y materialización de interfaces y flujos de trabajo.
              </p>
            </section>

            <section className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-5 sm:p-6 transition hover:border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  02
                </span>
                <h2 className="text-lg sm:text-xl font-semibold text-slate-100">
                  Roles y Control de Acceso (RBAC)
                </h2>
              </div>
              <p className="text-slate-300 pl-11">
                El sistema implementa un estricto control de acceso basado en roles (<strong className="text-slate-100 font-semibold">Administrador</strong> y <strong className="text-slate-100 font-semibold">Desarrollador</strong>). Las operaciones administrativas y la gestión de proyectos están restringidas según los privilegios autorizados en el perfil del usuario.
              </p>
            </section>

            <section className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-5 sm:p-6 transition hover:border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  03
                </span>
                <h2 className="text-lg sm:text-xl font-semibold text-slate-100">
                  Protección de Datos y Privacidad
                </h2>
              </div>
              <p className="text-slate-300 pl-11">
                CanvasAI almacena credenciales y configuraciones en una capa de persistencia simulada (<code className="text-xs bg-slate-800 px-2 py-0.5 rounded text-emerald-300">db.json</code> / JSON Server) diseñada para entornos académicos y formativos de <strong className="text-slate-100 font-semibold">FWD Academy</strong>, garantizando buenas prácticas de seguridad e integridad.
              </p>
            </section>
          </div>

          {/* Footer de la tarjeta */}
          <div className="mt-8 pt-6 border-t border-slate-800/70 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
            <span>Última revisión: Septiembre 2026 • Cumplimiento WCAG 2.1 AA</span>
            <span className="text-emerald-400 font-medium">CanvasAI Studio Platform</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
