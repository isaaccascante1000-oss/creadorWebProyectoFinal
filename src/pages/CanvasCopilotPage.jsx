import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { geminiService } from '../services/geminiService';
import { n8nService } from '../services/n8nService';
import { AccessibilityToolbar } from '../components/AccessibilityToolbar';

export const CanvasCopilotPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('canvas'); // 'canvas' | 'code' | 'iframe'
  const [promptText, setPromptText] = useState('Crear un componente de tarjeta de perfil con avatar, insignia de verificado y botón de seguir en modo oscuro.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExportingN8N, setIsExportingN8N] = useState(false);
  const [n8nStatusMsg, setN8nStatusMsg] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  
  const stageRef = useRef(null);

  const currentUser = authService.getCurrentUser();
  const userRole = authService.getUserRole();

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  /**
   * Exporta o guarda el proyecto finalizado enviando un webhook POST a N8N
   */
  const handleExportProjectToN8N = async () => {
    setIsExportingN8N(true);
    try {
      const res = await n8nService.sendProjectExportWebhook({
        title: promptText || 'Proyecto Generativo CanvasAI',
        prompt: promptText,
        code: generatedCode || '<!-- Componente de Lienzo -->',
        user: currentUser,
        format: 'React + Tailwind JSX',
      });
      setN8nStatusMsg('¡Webhook enviado a N8N con éxito! ⚡');
    } catch (err) {
      setN8nStatusMsg('Error enviando a N8N');
    } finally {
      setIsExportingN8N(false);
      setTimeout(() => setN8nStatusMsg(''), 4000);
    }
  };

  /**
   * Genera el código a través de Gemini Service y lo inyecta en la previsualización del iframe
   */
  const handleGenerateUI = async (e) => {
    e?.preventDefault();
    if (!promptText.trim()) return;

    setIsGenerating(true);

    try {
      // Simula captura Base64 del lienzo o canvas
      const dummyBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      
      // Llamada al servicio de Gemini
      const code = await geminiService.generateUIFromCanvas(dummyBase64, promptText);
      setGeneratedCode(code);
      setActiveTab('iframe');
    } catch (error) {
      console.error('Error al generar código UI:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Prepara el documento HTML que se inyectará en el iframe de previsualización
  const iframeDocument = `
<!DOCTYPE html>
<html class="dark">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
  <style>
    body { background-color: #0b1326; color: #dae2fd; padding: 1.5rem; margin: 0; font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body class="bg-slate-950 min-h-screen flex items-center justify-center">
  ${generatedCode || '<div class="text-center text-slate-500 font-sans text-sm">Haz clic en "Generar" para sintetizar código dinámico con Gemini 1.5 Pro.</div>'}
</body>
</html>`;

  return (
    <div className="w-full h-screen bg-surface flex flex-col overflow-hidden text-on-surface">
      {/* Top Application Bar */}
      <header className="h-14 bg-surface-container-low border-b border-outline-variant/30 px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow">
              <span className="material-symbols-outlined text-on-primary text-xl">terminal</span>
            </div>
            <span className="font-headline-sm text-lg font-bold">CanvasAI Studio</span>
          </Link>
          <span className="text-outline">/</span>
          <span className="font-label-sm text-label-sm text-tertiary">Copilot Visual Pro</span>
        </div>

        {/* Studio View Modes */}
        <div className="flex items-center gap-1 p-1 bg-surface-container-lowest rounded-lg border border-outline-variant/20">
          <button
            onClick={() => setActiveTab('canvas')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
              activeTab === 'canvas' ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Lienzo Interactivo
          </button>
          <button
            onClick={() => setActiveTab('iframe')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
              activeTab === 'iframe' ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Previsualización iframe
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
              activeTab === 'code' ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Código HTML/JSX
          </button>
        </div>

        {/* Navigation & User Status */}
        <div className="flex items-center gap-3">
          <AccessibilityToolbar />
          
          {/* Botón de Exportación N8N */}
          <button
            onClick={handleExportProjectToN8N}
            disabled={isExportingN8N}
            title="Enviar evento de exportación de proyecto a N8N via Webhook"
            className="px-3 py-1 rounded-md bg-secondary-container/30 border border-secondary/40 text-secondary text-xs font-semibold hover:bg-secondary-container/60 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">hub</span>
            <span>{isExportingN8N ? 'Enviando...' : 'Exportar a N8N'}</span>
          </button>

          {n8nStatusMsg && (
            <span className="text-[11px] font-semibold text-tertiary bg-tertiary-container/20 px-2 py-0.5 rounded border border-tertiary/30 animate-pulse">
              {n8nStatusMsg}
            </span>
          )}

          {userRole === 'admin' && (
            <Link to="/admin" className="text-xs font-label-md text-primary hover:underline flex items-center gap-1">
              <span className="material-symbols-outlined text-base">dashboard</span>
              Panel Admin
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="text-xs text-outline hover:text-on-surface px-2.5 py-1 rounded bg-surface-container-lowest border border-outline-variant/20 cursor-pointer"
          >
            Salir
          </button>
          <div
            className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center font-bold text-xs text-on-primary-container"
            title={currentUser?.email || 'Usuario'}
          >
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Toolbar Dock */}
        <div className="w-64 bg-surface-container-low border-r border-outline-variant/30 p-4 flex flex-col gap-4">
          <div className="font-label-md text-xs uppercase tracking-wider text-outline font-semibold">
            Herramientas de Dibujo
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="p-3 rounded-lg bg-surface-container hover:bg-surface-container-high transition flex flex-col items-center gap-1 text-xs">
              <span className="material-symbols-outlined text-primary">square</span>
              <span>Rectángulo</span>
            </button>
            <button className="p-3 rounded-lg bg-surface-container hover:bg-surface-container-high transition flex flex-col items-center gap-1 text-xs">
              <span className="material-symbols-outlined text-tertiary">circle</span>
              <span>Círculo</span>
            </button>
            <button className="p-3 rounded-lg bg-surface-container hover:bg-surface-container-high transition flex flex-col items-center gap-1 text-xs">
              <span className="material-symbols-outlined text-secondary">text_fields</span>
              <span>Texto</span>
            </button>
            <button className="p-3 rounded-lg bg-surface-container hover:bg-surface-container-high transition flex flex-col items-center gap-1 text-xs">
              <span className="material-symbols-outlined text-outline">smart_button</span>
              <span>Botón</span>
            </button>
          </div>

          <div className="mt-auto p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-xs space-y-1">
            <div className="flex items-center gap-2 text-tertiary font-semibold">
              <span className="material-symbols-outlined text-base">memory</span> Gemini 1.5 Pro Active
            </div>
            <p className="text-on-surface-variant text-[11px]">
              SDK oficial cargado. Genera componentes React/Tailwind directamente desde el lienzo.
            </p>
          </div>
        </div>

        {/* Center Stage Workspace */}
        <div className="flex-1 bg-surface-dim relative flex flex-col justify-between p-6 overflow-auto">
          {/* Active Stage Mode Switching */}
          {activeTab === 'canvas' && (
            <div
              ref={stageRef}
              className="w-full flex-1 rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-lowest/50 flex flex-col items-center justify-center relative p-8 shadow-inner min-h-[400px]"
            >
              <div className="absolute top-4 left-4 flex items-center gap-2 font-label-sm text-xs text-outline">
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                Lienzo interactivo activo (Fabric.js Stage)
              </div>

              {/* Sample Profile Component Canvas Card */}
              <div className="p-6 max-w-md w-full bg-surface-container rounded-2xl border border-outline-variant/30 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary text-primary flex items-center justify-center font-bold text-lg">
                      IC
                    </div>
                    <div>
                      <h3 className="font-semibold text-on-surface">Isaac Cascante</h3>
                      <p className="text-xs text-outline">Frontend Architect</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-tertiary-container/30 text-tertiary text-xs font-semibold">
                    Pro
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant">
                  Especialista en desarrollo web moderno con React, Tailwind CSS y arquitecturas generativas IA.
                </p>
                <button className="w-full py-2 rounded-lg bg-primary text-on-primary font-semibold text-xs shadow hover:bg-primary-fixed-dim transition">
                  Seguir Perfil
                </button>
              </div>
            </div>
          )}

          {activeTab === 'iframe' && (
            <div className="w-full flex-1 rounded-xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden shadow-2xl min-h-[400px]">
              <div className="h-9 bg-surface-container-high px-4 flex items-center justify-between text-xs text-outline border-b border-outline-variant/20">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Previsualización en tiempo real (Iframe Sandbox)
                </span>
                <span className="font-mono text-[11px]">Rendered in Sandbox</span>
              </div>
              <iframe
                title="Live UI Sandbox"
                srcDoc={iframeDocument}
                className="w-full h-[calc(100%-36px)] border-none bg-slate-950"
              />
            </div>
          )}

          {activeTab === 'code' && (
            <div className="w-full flex-1 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 overflow-auto shadow-2xl min-h-[400px]">
              <div className="flex items-center justify-between text-xs text-outline mb-3 border-b border-outline-variant/20 pb-2">
                <span className="font-mono font-semibold text-primary">CÓDIGO GENERADO (HTML / TAILWIND)</span>
                <button
                  onClick={() => navigator.clipboard.writeText(generatedCode)}
                  className="px-2 py-1 rounded bg-surface-container hover:bg-surface-bright text-xs text-on-surface transition"
                >
                  Copiar Código
                </button>
              </div>
              <pre className="font-mono text-xs text-tertiary leading-relaxed overflow-x-auto p-3 bg-surface-dim rounded-lg border border-outline-variant/20">
                {generatedCode || '// El código HTML/JSX generado aparecerá aquí tras presionar "Generar".'}
              </pre>
            </div>
          )}

          {/* Floating AI Prompt Terminal */}
          <form
            onSubmit={handleGenerateUI}
            className="mt-4 w-full max-w-3xl mx-auto bg-surface-container-high rounded-xl p-3 border border-outline-variant/30 shadow-2xl flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
            <input
              type="text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Describe los cambios o componente que deseas generar con Gemini 1.5 Pro..."
              className="flex-1 bg-transparent text-xs text-on-surface focus:outline-none placeholder:text-outline"
            />
            <button
              type="submit"
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-fixed-dim text-on-primary text-xs font-semibold shadow hover:opacity-90 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                  <span>Sintetizando...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">bolt</span>
                  <span>Generar</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CanvasCopilotPage;
