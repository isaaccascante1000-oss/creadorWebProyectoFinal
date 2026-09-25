import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Canvas, Rect, Circle, IText, Group } from 'fabric';
import { authService } from '../services/authService';
import { geminiService } from '../services/geminiService';
import { mistralService } from '../services/mistralService';
import { n8nService } from '../services/n8nService';
import { AccessibilityToolbar } from '../components/AccessibilityToolbar';
import { ToastNotification } from '../components/ToastNotification';

export const CanvasCopilotPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('canvas');
  const [promptText, setPromptText] = useState('Crear un componente de tarjeta de perfil con avatar, insignia de verificado y botón de seguir en modo oscuro.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExportingN8N, setIsExportingN8N] = useState(false);
  const [, setN8nStatusMsg] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeViewMode, setCodeViewMode] = useState('jsx'); // 'jsx' o 'html'
  const [isCopied, setIsCopied] = useState(false);
  
  const [toastState, setToastState] = useState({ show: false, message: '', icon: 'info' });
  const showToast = (message, icon = 'info') => {
    setToastState({ show: true, message, icon });
    setTimeout(() => setToastState(prev => ({ ...prev, show: false })), 4000);
  };

  const extractPureCode = (rawText) => {
    if (!rawText) return '';
    
    let textToProcess = rawText;
    // Try to parse JSON if stringified
    try {
      const parsed = JSON.parse(rawText);
      if (typeof parsed === 'string') textToProcess = parsed;
      else if (parsed.output) textToProcess = parsed.output;
      else if (parsed.text) textToProcess = parsed.text;
    } catch (e) {
      // Not JSON, continue with raw text
    }

    // Intentar extraer de bloques markdown
    const jsxMatch = textToProcess.match(/```(?:jsx|html|javascript)?\s*([\s\S]*?)```/i);
    if (jsxMatch && jsxMatch[1]) {
      return jsxMatch[1].trim();
    }
    // Si no hay markdown, extraer el primer y último tag HTML/JSX asumiendo que el resto es charla
    const firstTag = textToProcess.indexOf('<');
    const lastTag = textToProcess.lastIndexOf('>');
    if (firstTag !== -1 && lastTag !== -1 && lastTag > firstTag) {
      return textToProcess.substring(firstTag, lastTag + 1).trim();
    }
    return textToProcess.trim();
  };

  const sanitizeJsxForIframe = (codeString) => {
    if (!codeString) return '';
    return codeString
      .replace(/import\s+.*?;/g, '') // Eliminar imports
      .replace(/export\s+default\s+.*?;?/g, '') // Eliminar exports
      .replace(/const\s+\w+\s*=\s*\(\)\s*=>\s*\{/g, '') // Eliminar declaración de componente flecha
      .replace(/function\s+\w+\s*\(\)\s*\{/g, '') // Eliminar declaración de componente function
      .replace(/return\s*\(/g, '') // Eliminar return (
      .replace(/\);\s*\}\s*$/g, '') // Eliminar cierre de componente
      .replace(/className=/g, 'class=') // Convierte className a class
      .replace(/\{(\/\*.*?\*\/)\}/g, ''); // Elimina comentarios de JSX
  };
  
  // Fabric Refs & State
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [selectedObject, setSelectedObject] = useState(null);
  const [, setUpdateTrigger] = useState(0);

  const currentUser = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  // --- FABRIC INIT V6/V7 ---
  useEffect(() => {
    if (activeTab !== 'canvas' || !canvasRef.current) return;
    
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
      fabricCanvasRef.current = null;
    }

    const container = canvasRef.current.parentElement;
    const initialWidth = container ? Math.max(container.clientWidth - 32, 600) : 780;

    const initCanvas = new Canvas(canvasRef.current, {
      width: initialWidth,
      height: 500,
      backgroundColor: '#0f172a',
      selection: true,
    });

    fabricCanvasRef.current = initCanvas;

    const handleSelection = () => {
      const activeObj = initCanvas.getActiveObject();
      setSelectedObject(activeObj || null);
      setUpdateTrigger(prev => prev + 1);
    };

    initCanvas.on('selection:created', handleSelection);
    initCanvas.on('selection:updated', handleSelection);
    initCanvas.on('selection:cleared', () => setSelectedObject(null));
    initCanvas.on('object:modified', handleSelection);
    initCanvas.on('object:scaling', handleSelection);
    initCanvas.on('object:moving', handleSelection);

    setCanvas(initCanvas);

    const resizeObserver = new ResizeObserver(() => {
      if (initCanvas && container && container.clientWidth > 0) {
        initCanvas.setDimensions({ width: container.clientWidth - 32, height: 500 });
        initCanvas.renderAll();
      }
    });

    if (container) {
      resizeObserver.observe(container);
    }

    return () => {
      resizeObserver.disconnect();
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
      setCanvas(null);
      setSelectedObject(null);
    };
  }, [activeTab]);

  // --- HERRAMIENTAS DE DIBUJO ---
  const addRect = () => {
    const activeCanvas = canvas || fabricCanvasRef.current;
    if (!activeCanvas) return;
    const rect = new Rect({ left: 100, top: 100, width: 120, height: 80, fill: '#3b82f6', rx: 8, ry: 8 });
    activeCanvas.add(rect);
    activeCanvas.setActiveObject(rect);
    activeCanvas.renderAll();
  };

  const addCircle = () => {
    const activeCanvas = canvas || fabricCanvasRef.current;
    if (!activeCanvas) return;
    const circle = new Circle({ left: 150, top: 150, radius: 40, fill: '#10b981' });
    activeCanvas.add(circle);
    activeCanvas.setActiveObject(circle);
    activeCanvas.renderAll();
  };

  const addText = () => {
    const activeCanvas = canvas || fabricCanvasRef.current;
    if (!activeCanvas) return;
    const text = new IText('Texto Editable', {
      left: 120, top: 120, fontSize: 20, fill: '#ffffff', fontFamily: 'Inter'
    });
    activeCanvas.add(text);
    activeCanvas.setActiveObject(text);
    activeCanvas.renderAll();
  };

  // --- PLANTILLAS WEB RÁPIDAS ---
  const addTemplate = (type) => {
    const activeCanvas = canvas || fabricCanvasRef.current;
    if (!activeCanvas) return;
    let groupObjects = [];

    if (type === 'header') {
      groupObjects = [
        new Rect({ left: 0, top: 0, width: 600, height: 60, fill: '#1e293b', rx: 6, ry: 6 }),
        new IText('CanvasAI Logo', { left: 20, top: 18, fontSize: 18, fill: '#38bdf8', fontWeight: 'bold' }),
        new IText('Inicio', { left: 450, top: 22, fontSize: 14, fill: '#cbd5e1' }),
        new IText('Contacto', { left: 510, top: 22, fontSize: 14, fill: '#cbd5e1' })
      ];
    } else if (type === 'hero') {
      groupObjects = [
        new Rect({ left: 0, top: 0, width: 600, height: 260, fill: '#0f172a', rx: 8, ry: 8 }),
        new IText('Diseña con IA en Tiempo Real', { left: 40, top: 60, fontSize: 26, fill: '#ffffff', fontWeight: 'bold' }),
        new IText('Genera componentes React y Tailwind al instante.', { left: 40, top: 110, fontSize: 15, fill: '#94a3b8' }),
        new Rect({ left: 40, top: 160, width: 140, height: 42, fill: '#2563eb', rx: 6, ry: 6 }),
        new IText('Empezar Ahora', { left: 62, top: 173, fontSize: 14, fill: '#ffffff', fontWeight: 'bold' })
      ];
    } else if (type === 'button') {
      groupObjects = [
        new Rect({ left: 0, top: 0, width: 140, height: 42, fill: '#3b82f6', rx: 6, ry: 6 }),
        new IText('Botón Acción', { left: 24, top: 12, fontSize: 14, fill: '#ffffff' })
      ];
    }

    const fabricGroup = new Group(groupObjects, { left: 50, top: 50 });
    activeCanvas.add(fabricGroup);
    activeCanvas.setActiveObject(fabricGroup);
    activeCanvas.renderAll();
  };

  // --- ACCIONES SOBRE EL CANVAS ---
  const deleteSelected = () => {
    const activeCanvas = canvas || fabricCanvasRef.current;
    if (!activeCanvas || !selectedObject) return;
    
    if (selectedObject.type === 'activeSelection') {
      selectedObject.forEachObject(obj => activeCanvas.remove(obj));
    } else {
      activeCanvas.remove(selectedObject);
    }
    activeCanvas.discardActiveObject();
    activeCanvas.renderAll();
    setSelectedObject(null);
  };

  const cloneSelected = async () => {
    const activeCanvas = canvas || fabricCanvasRef.current;
    if (!activeCanvas || !selectedObject) return;
    try {
      const cloned = await selectedObject.clone();
      cloned.set({
        left: cloned.left + 20,
        top: cloned.top + 20,
        evented: true,
      });
      if (cloned.type === 'activeSelection') {
        cloned.canvas = activeCanvas;
        cloned.forEachObject((obj) => activeCanvas.add(obj));
        cloned.setCoords();
      } else {
        activeCanvas.add(cloned);
      }
      activeCanvas.setActiveObject(cloned);
      activeCanvas.requestRenderAll();
    } catch (e) {
      console.error('Error clonando objeto:', e);
    }
  };

  const bringForward = () => {
    const activeCanvas = canvas || fabricCanvasRef.current;
    if (!activeCanvas || !selectedObject) return;
    activeCanvas.bringObjectForward(selectedObject);
    activeCanvas.renderAll();
  };

  const sendBackward = () => {
    const activeCanvas = canvas || fabricCanvasRef.current;
    if (!activeCanvas || !selectedObject) return;
    activeCanvas.sendObjectBackwards(selectedObject);
    activeCanvas.renderAll();
  };

  const clearCanvas = () => {
    const activeCanvas = canvas || fabricCanvasRef.current;
    if (!activeCanvas) return;
    activeCanvas.clear();
    activeCanvas.backgroundColor = 'transparent';
    activeCanvas.renderAll();
    setSelectedObject(null);
  };

  // --- INSPECTOR DE PROPIEDADES ---
  const updateProp = (prop, value) => {
    const activeCanvas = canvas || fabricCanvasRef.current;
    if (!activeCanvas || !selectedObject) return;

    if (prop === 'text' && (selectedObject.type === 'i-text' || selectedObject.type === 'textbox' || selectedObject.type === 'text')) {
      selectedObject.set('text', value);
    } else {
      selectedObject.set(prop, value);
    }
    
    activeCanvas.renderAll();
    setUpdateTrigger(prev => prev + 1);
  };

  const getProp = (prop, defaultVal = '') => {
    if (!selectedObject) return defaultVal;
    if (prop === 'text' && selectedObject.text !== undefined) return selectedObject.text;
    if (typeof selectedObject.get === 'function') {
      const val = selectedObject.get(prop);
      return val !== undefined && val !== null ? val : defaultVal;
    }
    return selectedObject[prop] ?? defaultVal;
  };

  // --- GENERACIÓN E INTEGRACIÓN ---
  const handleExportProjectToN8N = async () => {
    const activeCanvas = canvas || fabricCanvasRef.current;
    setIsExportingN8N(true);
    setN8nStatusMsg('Enviando...');
    try {
      const result = await n8nService.triggerWorkflow({
        action: 'EXPORT_PROJECT',
        title: promptText || 'Proyecto CanvasAI',
        prompt: promptText,
        code: generatedCode,
        canvasJson: activeCanvas ? activeCanvas.toJSON() : {},
        user: currentUser,
      });
      if (result.success) {
        showToast('Enviado a n8n exitosamente', 'check_circle');
        setN8nStatusMsg('¡Enviado a n8n!');
      } else {
        showToast('Error al exportar a n8n', 'error');
        setN8nStatusMsg('Error en n8n');
      }
    } catch (err) {
      showToast('Error de red al conectar con n8n', 'error');
      setN8nStatusMsg('Error de red');
    } finally {
      setIsExportingN8N(false);
      setTimeout(() => setN8nStatusMsg(''), 4000);
    }
  };

  const handleGenerateUI = async (e) => {
    e?.preventDefault();
    const activeCanvas = canvas || fabricCanvasRef.current;
    
    if (!activeCanvas || activeCanvas.getObjects().length === 0) {
      showToast('Dibuja algo o elige una plantilla primero.', 'warning');
      return;
    }
    setIsGenerating(true);
    showToast('Generando UI con Gemini...', 'auto_awesome');

    try {
      const canvasJSON = activeCanvas.toJSON();
      const payload = {
        prompt: promptText,
        canvasJson: canvasJSON,
        user: currentUser
      };

      let result = await n8nService.triggerWorkflow(payload);
      
      let pureCode = '';
      if (result.success && result.data) {
        let rawCode = typeof result.data.jsxCode === 'string' ? result.data.jsxCode : JSON.stringify(result.data.jsxCode);
        pureCode = extractPureCode(rawCode);
      }

      if (!pureCode) {
        // Fallback a Mistral o parseo local si n8n no devolvió nada útil
        showToast('N8n vacío o congestionado, conmutando a Mistral AI (Fallback)...', 'sync');
        result = await mistralService.generateUIFromPrompt(promptText, JSON.stringify(canvasJSON));
        if (result.success && result.data) {
          let rawCode = typeof result.data.jsxCode === 'string' ? result.data.jsxCode : JSON.stringify(result.data.jsxCode);
          pureCode = extractPureCode(rawCode);
        }
      }
      
      if (pureCode) {
        setGeneratedCode(pureCode);
        setActiveTab('iframe');
        showToast('UI Generada con éxito', 'verified');
      } else {
        showToast(result.error || 'Error en la generación, el lienzo devolvió código vacío.', 'error');
      }
    } catch (error) {
      showToast('Error inesperado al conectar con Gemini', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    const textToCopy = codeViewMode === 'html' ? sanitizeJsxForIframe(generatedCode) : generatedCode;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      showToast('¡Código copiado al portapapeles!', 'content_copy');
    }).catch(() => {
      showToast('Error al copiar el código', 'error');
    });
  };

  const iframeDocument = `
<!DOCTYPE html>
<html class="dark">
<head>
  <meta charset="utf-8"/>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #0b1326; color: #dae2fd; padding: 1.5rem; }
    img { max-width: 100%; height: auto; max-height: 200px; object-fit: cover; border-radius: 0.5rem; }
  </style>
</head>
<body class="min-h-screen">
  ${sanitizeJsxForIframe(generatedCode) || '<div class="text-slate-500 flex items-center justify-center h-full mt-10">Dibuja en el lienzo y presiona "Generar UI" para visualizar el código sintetizado.</div>'}
</body>
</html>`;

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden text-on-surface bg-surface">
      {/* HEADER */}
      <header className="h-14 bg-surface-container-low border-b border-outline-variant/30 px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow">
              <span className="material-symbols-outlined text-on-primary text-xl">terminal</span>
            </div>
            <span className="font-headline-sm text-lg font-bold">CanvasAI Studio</span>
          </Link>
        </div>

        <div className="flex items-center gap-1 p-1 bg-surface-container-lowest rounded-lg border border-outline-variant/20">
          <button onClick={() => setActiveTab('canvas')} className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === 'canvas' ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant'}`}>Lienzo</button>
          <button onClick={() => setActiveTab('iframe')} className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === 'iframe' ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant'}`}>Iframe</button>
          <button onClick={() => setActiveTab('code')} className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === 'code' ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant'}`}>Código</button>
        </div>

        <div className="flex items-center gap-3">
          <AccessibilityToolbar />
          <button onClick={handleExportProjectToN8N} disabled={isExportingN8N} className="px-3 py-1 rounded-md bg-secondary-container/30 border border-secondary/40 text-secondary text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-secondary-container/50 transition">
            <span className="material-symbols-outlined text-base">hub</span> {isExportingN8N ? 'Enviando...' : 'Exportar N8N'}
          </button>
          <button onClick={handleLogout} className="text-xs text-outline px-2.5 py-1 rounded border border-outline-variant/20 hover:bg-surface-container-high transition">Salir</button>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT TOOLBAR */}
        <div className="w-64 bg-surface-container-low border-r border-outline-variant/30 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-outline-variant/20">
            <h3 className="text-xs uppercase text-outline font-semibold mb-3">Dibujo Básico</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={addRect} className="p-2 rounded bg-surface-container hover:bg-surface-container-high text-xs flex flex-col items-center gap-1 border border-outline-variant/20 transition">
                <span className="material-symbols-outlined text-primary">square</span> Rectángulo
              </button>
              <button onClick={addCircle} className="p-2 rounded bg-surface-container hover:bg-surface-container-high text-xs flex flex-col items-center gap-1 border border-outline-variant/20 transition">
                <span className="material-symbols-outlined text-tertiary">circle</span> Círculo
              </button>
              <button onClick={addText} className="p-2 rounded bg-surface-container hover:bg-surface-container-high text-xs flex flex-col items-center gap-1 border border-outline-variant/20 transition col-span-2">
                <span className="material-symbols-outlined text-secondary">title</span> Texto Editable
              </button>
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-xs uppercase text-outline font-semibold mb-3">Plantillas Web</h3>
            <div className="space-y-2">
              <button onClick={() => addTemplate('header')} className="w-full text-left p-2 rounded bg-surface-container hover:bg-surface-container-high text-xs flex items-center gap-2 border border-outline-variant/20 transition">
                <span className="material-symbols-outlined text-outline text-sm">view_stream</span> Header / Navbar
              </button>
              <button onClick={() => addTemplate('hero')} className="w-full text-left p-2 rounded bg-surface-container hover:bg-surface-container-high text-xs flex items-center gap-2 border border-outline-variant/20 transition">
                <span className="material-symbols-outlined text-outline text-sm">web_asset</span> Hero Section
              </button>
              <button onClick={() => addTemplate('button')} className="w-full text-left p-2 rounded bg-surface-container hover:bg-surface-container-high text-xs flex items-center gap-2 border border-outline-variant/20 transition">
                <span className="material-symbols-outlined text-outline text-sm">smart_button</span> Botón Interactivo
              </button>
            </div>
          </div>
        </div>

        {/* CENTER STAGE */}
        <div className="flex-1 bg-surface-dim relative flex flex-col h-full overflow-hidden">
          {/* Action Toolbar */}
          {activeTab === 'canvas' && (
            <div className="h-12 border-b border-outline-variant/30 flex items-center justify-between px-4 bg-surface-container-lowest shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={deleteSelected} disabled={!selectedObject} className="p-1.5 rounded hover:bg-surface-container-high disabled:opacity-30 text-error transition" title="Eliminar seleccionado">
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
                <button onClick={cloneSelected} disabled={!selectedObject} className="p-1.5 rounded hover:bg-surface-container-high disabled:opacity-30 text-on-surface transition" title="Duplicar">
                  <span className="material-symbols-outlined text-lg">content_copy</span>
                </button>
                <div className="w-px h-5 bg-outline-variant/40 mx-1"></div>
                <button onClick={bringForward} disabled={!selectedObject} className="p-1.5 rounded hover:bg-surface-container-high disabled:opacity-30 text-on-surface transition" title="Traer adelante">
                  <span className="material-symbols-outlined text-lg">flip_to_front</span>
                </button>
                <button onClick={sendBackward} disabled={!selectedObject} className="p-1.5 rounded hover:bg-surface-container-high disabled:opacity-30 text-on-surface transition" title="Enviar atrás">
                  <span className="material-symbols-outlined text-lg">flip_to_back</span>
                </button>
              </div>
              <button onClick={clearCanvas} className="flex items-center gap-1 px-3 py-1.5 rounded text-xs text-error bg-error-container/20 hover:bg-error-container/40 font-semibold transition">
                <span className="material-symbols-outlined text-[16px]">mop</span> Limpiar
              </button>
            </div>
          )}

          <div className="flex-1 relative overflow-auto p-4 w-full h-full flex items-center justify-center">
            {activeTab === 'canvas' && (
              <div className="w-full h-full border border-dashed border-outline-variant/40 rounded-xl overflow-hidden shadow-inner flex justify-center items-center bg-surface-container-lowest/50" style={{ minHeight: '500px' }}>
                <canvas ref={canvasRef} />
              </div>
            )}
            
            {activeTab === 'iframe' && (
              <div className="w-full h-full rounded-xl border border-outline-variant/30 overflow-hidden">
                <iframe srcDoc={iframeDocument} title="Preview UI" className="w-full h-full bg-black border-none" />
              </div>
            )}

            {activeTab === 'code' && (
              <div className="w-full h-full flex flex-col rounded-xl border border-outline-variant/30 bg-[#1e1e1e] overflow-hidden shadow-lg">
                <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-white/10 shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-outline text-sm">code</span>
                    <span className="text-xs font-mono text-outline">
                      {codeViewMode === 'jsx' ? 'GeneratedComponent.jsx' : 'index.html'}
                    </span>
                    <div className="flex bg-black/40 rounded p-0.5 ml-4">
                      <button onClick={() => setCodeViewMode('jsx')} className={`px-2 py-1 text-[10px] font-semibold rounded uppercase transition ${codeViewMode === 'jsx' ? 'bg-[#3b82f6] text-white' : 'text-gray-400 hover:text-white'}`}>JSX / React</button>
                      <button onClick={() => setCodeViewMode('html')} className={`px-2 py-1 text-[10px] font-semibold rounded uppercase transition ${codeViewMode === 'html' ? 'bg-[#10b981] text-white' : 'text-gray-400 hover:text-white'}`}>HTML Puro</button>
                    </div>
                  </div>
                  <button onClick={copyToClipboard} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition">
                    <span className="material-symbols-outlined text-[14px]">
                      {isCopied ? 'check' : 'content_copy'}
                    </span>
                    {isCopied ? '¡Copiado!' : 'Copiar Código'}
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-4 flex">
                  <div className="text-right pr-4 border-r border-white/10 select-none text-gray-600 font-mono text-xs w-10 shrink-0">
                    {/* Line numbers fake generation */}
                    {generatedCode ? generatedCode.split('\\n').map((_, i) => <div key={i}>{i + 1}</div>) : <div>1</div>}
                  </div>
                  <pre className="text-xs font-mono text-gray-300 flex-1 pl-4 overflow-x-auto whitespace-pre">
                    {generatedCode ? (codeViewMode === 'html' ? sanitizeJsxForIframe(generatedCode) : generatedCode) : '// Dibuja en el lienzo y presiona "Generar UI"\\n// El código limpio aparecerá aquí.'}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* AI Footer Prompt */}
          <form onSubmit={handleGenerateUI} className="p-4 bg-surface-container-low border-t border-outline-variant/30 shrink-0">
            <div className="max-w-4xl mx-auto flex items-center gap-3">
              <input type="text" value={promptText} onChange={(e) => setPromptText(e.target.value)} placeholder="Describe qué quieres generar a partir del lienzo..." className="flex-1 bg-surface-container-highest border border-outline-variant/50 rounded-lg px-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition" />
              <button type="submit" disabled={isGenerating} className="px-6 py-2 rounded-lg bg-primary text-on-primary font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition disabled:opacity-50">
                {isGenerating ? 'Generando...' : 'Generar UI'} <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT PROPERTY INSPECTOR */}
        {activeTab === 'canvas' && (
          <div className="w-72 bg-surface-container-low border-l border-outline-variant/30 flex flex-col shrink-0 overflow-y-auto">
            <div className="p-4 border-b border-outline-variant/20 font-semibold text-sm text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined">tune</span> Personalizar Elemento
            </div>
            
            {!selectedObject ? (
              <div className="p-6 text-center text-xs text-outline">
                Selecciona un elemento en el lienzo para ver sus propiedades.
              </div>
            ) : (
              <div className="p-4 space-y-4 text-xs">
                {/* Texto */}
                {(selectedObject.type === 'textbox' || selectedObject.type === 'i-text' || selectedObject.type === 'text') && (
                  <div className="space-y-1">
                    <label className="text-outline font-semibold">Contenido del Texto</label>
                    <textarea 
                      value={getProp('text', '')} 
                      onChange={e => updateProp('text', e.target.value)}
                      className="w-full bg-surface-container-highest border border-outline-variant/50 rounded p-2 text-on-surface focus:outline-none"
                    />
                    
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="space-y-1">
                        <label className="text-outline">Tam. Fuente</label>
                        <input type="number" value={getProp('fontSize', 16)} onChange={e => updateProp('fontSize', parseInt(e.target.value) || 12)} className="w-full bg-surface-container-highest border border-outline-variant/50 rounded p-1" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-outline">Alineación</label>
                        <select value={getProp('textAlign', 'left')} onChange={e => updateProp('textAlign', e.target.value)} className="w-full bg-surface-container-highest border border-outline-variant/50 rounded p-1">
                          <option value="left">Izquierda</option>
                          <option value="center">Centro</option>
                          <option value="right">Derecha</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Colores */}
                {selectedObject.type !== 'group' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-outline font-semibold">Fondo (Fill)</label>
                      <input type="color" value={getProp('fill', '#3b82f6')} onChange={e => updateProp('fill', e.target.value)} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-outline font-semibold">Borde (Stroke)</label>
                      <input type="color" value={getProp('stroke', '#000000')} onChange={e => updateProp('stroke', e.target.value)} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <label className="text-outline">Grosor de Borde</label>
                      <input type="number" value={getProp('strokeWidth', 0)} onChange={e => updateProp('strokeWidth', parseInt(e.target.value) || 0)} className="w-16 bg-surface-container-highest border border-outline-variant/50 rounded p-1 text-right" />
                    </div>
                  </div>
                )}

                {/* Dimensiones y Posición */}
                <div className="space-y-2 pt-3 border-t border-outline-variant/20">
                  <label className="text-outline font-semibold">Geometría</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-outline">Ancho</label>
                      <input type="number" value={Math.round(getProp('width', 0) * getProp('scaleX', 1))} onChange={e => { updateProp('width', parseInt(e.target.value) || 10); updateProp('scaleX', 1); }} className="w-full bg-surface-container-highest border border-outline-variant/50 rounded p-1" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-outline">Alto</label>
                      <input type="number" value={Math.round(getProp('height', 0) * getProp('scaleY', 1))} onChange={e => { updateProp('height', parseInt(e.target.value) || 10); updateProp('scaleY', 1); }} className="w-full bg-surface-container-highest border border-outline-variant/50 rounded p-1" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-outline">Posición X</label>
                      <input type="number" value={Math.round(getProp('left', 0))} onChange={e => updateProp('left', parseInt(e.target.value) || 0)} className="w-full bg-surface-container-highest border border-outline-variant/50 rounded p-1" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-outline">Posición Y</label>
                      <input type="number" value={Math.round(getProp('top', 0))} onChange={e => updateProp('top', parseInt(e.target.value) || 0)} className="w-full bg-surface-container-highest border border-outline-variant/50 rounded p-1" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1 pt-3 border-t border-outline-variant/20">
                  <div className="flex justify-between">
                    <label className="text-outline font-semibold">Opacidad</label>
                    <span>{Math.round(getProp('opacity', 1) * 100)}%</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.05" value={getProp('opacity', 1)} onChange={e => updateProp('opacity', parseFloat(e.target.value))} className="w-full accent-primary" />
                </div>
                
              </div>
            )}
          </div>
        )}
      </div>

      <ToastNotification show={toastState.show} message={toastState.message} icon={toastState.icon} />
    </div>
  );
};

export default CanvasCopilotPage;