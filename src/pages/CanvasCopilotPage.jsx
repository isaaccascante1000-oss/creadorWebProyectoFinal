import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Canvas, Rect, Circle, IText, Group } from 'fabric';
import { n8nService } from '../services/n8nService';
import { AccessibilityToolbar } from '../components/AccessibilityToolbar';
import { ToastNotification } from '../components/ToastNotification';
import { CanvasErrorBoundary } from '../components/CanvasErrorBoundary';
import { useSelection } from '../context/useSelection';
import { useAuth } from '../context/AuthContext';
import { serializeCanvasForAI } from '../utils/canvasSerialization';
import { getErrorMessage } from '../utils/errorMessage';
import { removeOAuthQueryParams } from '../utils/oauthUrl';

export const CanvasCopilotPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('canvas');
  const [promptText, setPromptText] = useState('Crear un componente de tarjeta de perfil con avatar, insignia de verificado y botón de seguir en modo oscuro.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExportingN8N, setIsExportingN8N] = useState(false);
  const [n8nStatusMsg, setN8nStatusMsg] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeViewMode, setCodeViewMode] = useState('jsx');
  const [isCopied, setIsCopied] = useState(false);

  const [toastState, setToastState] = useState({ show: false, message: '', icon: 'info' });
  const showToast = (message, icon = 'info') => {
    setToastState({ show: true, message: getErrorMessage(message, 'Ocurrió un error inesperado.'), icon });
    setTimeout(() => setToastState((prev) => ({ ...prev, show: false })), 4000);
  };

  useEffect(() => {
    const browserSearch = removeOAuthQueryParams(window.location.search);
    if (browserSearch.changed) {
      const query = browserSearch.search ? `?${browserSearch.search}` : '';
      window.history.replaceState({}, document.title, `${window.location.pathname}${query}${window.location.hash}`);
    }

    const routerSearch = removeOAuthQueryParams(location.search);
    if (routerSearch.changed) {
      navigate({
        pathname: location.pathname,
        search: routerSearch.search ? `?${routerSearch.search}` : '',
        hash: location.hash,
      }, { replace: true });
    }
  }, [location.hash, location.pathname, location.search, navigate]);

  const extractPureCode = (rawText) => {
    if (!rawText) return '';
    let textToProcess = String(rawText).trim();
    const fencedCode = textToProcess.match(/^```(?:html|jsx|tsx|javascript)?\s*([\s\S]*?)\s*```$/i);
    if (fencedCode) textToProcess = fencedCode[1].trim();
    try {
      const parsed = JSON.parse(textToProcess);
      const code = parsed.output || parsed.text || parsed.code || parsed.html || parsed.jsxCode;
      if (typeof code === 'string') {
        return extractPureCode(code);
      }
    } catch {
      return textToProcess;
    }
    return textToProcess;
  };

  const sanitizeJsxForIframe = (codeString) => {
    if (!codeString) return '';
    return codeString.replace(/\bclassName=/g, 'class=');
  };

  const formatGeneratedCode = () => (
    codeViewMode === 'html'
      ? sanitizeJsxForIframe(generatedCode)
      : generatedCode.replace(/\bclass=/g, 'className=').trim()
  );

  const canvasRef = useRef(null);
  const canvasStageRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const { selectedObject, setSelectedObject } = useSelection();
  const auth = useAuth();
  const [, setUpdateTrigger] = useState(0);
  const [quickToolbarPosition, setQuickToolbarPosition] = useState(null);

  const currentUser = auth.user;

  const handleLogout = async () => {
    await auth.logout();
    navigate('/');
  };

  const disposePromiseRef = useRef(Promise.resolve());

  const queueCanvasDispose = (canvasToDispose) => {
    if (!canvasToDispose) return;
    disposePromiseRef.current = Promise.resolve()
      .then(() => canvasToDispose.dispose())
      .catch(() => undefined);
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    let cancelled = false;
    let initCanvas = null;
    let resizeObserver = null;

    const setup = async () => {
      try {
        await disposePromiseRef.current;
      } catch {
        // Ignorar
      }

      if (cancelled || !canvasRef.current) return;

      const canvasElement = canvasRef.current;

      if (canvasElement.__fabric) {
        try {
          delete canvasElement.__fabric;
        } catch (error) {
          console.warn('Limpieza previa fallida:', error);
        }
      }

      const previousWidth = canvasElement.width;
      canvasElement.width = 0;
      canvasElement.width = previousWidth;

      const container = canvasElement.parentElement;
      const initialWidth = container ? Math.max(container.clientWidth - 32, 600) : 780;

      try {
        initCanvas = new Canvas(canvasElement, {
          width: initialWidth,
          height: 500,
          backgroundColor: '#0f172a',
          selection: true,
        });
      } catch {
        return;
      }

      if (cancelled) {
        queueCanvasDispose(initCanvas);
        return;
      }

      try {
        fabricCanvasRef.current = initCanvas;
        attachCanvasBehavior(initCanvas, container, canvasStageRef.current);
      } catch {
        fabricCanvasRef.current = null;
        queueCanvasDispose(initCanvas);
      }
    };

    const attachCanvasBehavior = (initCanvas, container, toolbarContainer) => {
      const updateQuickToolbarPosition = (activeObj) => {
        if (!activeObj || !container || !toolbarContainer || typeof activeObj.getBoundingRect !== 'function') {
          setQuickToolbarPosition(null);
          return;
        }

        try {
          activeObj.setCoords?.();
          const objectBounds = activeObj.getBoundingRect();
          const canvasElement = initCanvas.getElement();
          if (!canvasElement || !objectBounds) {
            setQuickToolbarPosition(null);
            return;
          }

          const canvasBounds = canvasElement.getBoundingClientRect();
          const hostBounds = toolbarContainer.getBoundingClientRect();
          const left = canvasBounds.left - hostBounds.left + objectBounds.left + objectBounds.width / 2;
          const top = canvasBounds.top - hostBounds.top + objectBounds.top;
          if (![left, top].every(Number.isFinite)) {
            setQuickToolbarPosition(null);
            return;
          }
          setQuickToolbarPosition({ left, top });
        } catch {
          setQuickToolbarPosition(null);
        }
      };

      const handleSelection = () => {
        const activeObj = initCanvas.getActiveObject();
        setSelectedObject(activeObj || null);
        updateQuickToolbarPosition(activeObj || null);
        setUpdateTrigger((prev) => prev + 1);
      };

      initCanvas.on('selection:created', handleSelection);
      initCanvas.on('selection:updated', handleSelection);
      initCanvas.on('selection:cleared', () => {
        setSelectedObject(null);
        setQuickToolbarPosition(null);
      });
      initCanvas.on('object:modified', handleSelection);
      initCanvas.on('object:scaling', handleSelection);
      initCanvas.on('object:moving', handleSelection);
      initCanvas.on('text:changed', handleSelection);
      initCanvas.on('mouse:dblclick', ({ target }) => {
        if (target && ['i-text', 'textbox', 'text'].includes(target.type)) {
          initCanvas.setActiveObject(target);
          target.enterEditing();
          target.selectAll();
          initCanvas.requestRenderAll();
        }
      });

      setCanvas(initCanvas);

      resizeObserver = new ResizeObserver(() => {
        if (initCanvas && container && container.clientWidth > 0) {
          initCanvas.setDimensions({ width: container.clientWidth - 32, height: 500 });
          initCanvas.renderAll();
        }
      });

      if (container) resizeObserver.observe(container);
    };

    setup();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      const toDispose = fabricCanvasRef.current || initCanvas;
      fabricCanvasRef.current = null;
      queueCanvasDispose(toDispose);
      setCanvas(null);
      setSelectedObject(null);
      setQuickToolbarPosition(null);
    };
  }, [setSelectedObject]);

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
    const text = new IText('Texto Editable', { left: 120, top: 120, fontSize: 20, fill: '#ffffff', fontFamily: 'Inter' });
    activeCanvas.add(text);
    activeCanvas.setActiveObject(text);
    activeCanvas.renderAll();
  };

  const addTemplate = (type) => {
    const activeCanvas = canvas || fabricCanvasRef.current;
    if (!activeCanvas) return;
    let groupObjects = [];

    if (type === 'header') {
      groupObjects = [
        new Rect({ left: 0, top: 0, width: 600, height: 60, fill: '#1e293b', rx: 6, ry: 6 }),
        new IText('CanvasAI Logo', { left: 20, top: 18, fontSize: 18, fill: '#38bdf8', fontWeight: 'bold' }),
        new IText('Inicio', { left: 450, top: 22, fontSize: 14, fill: '#cbd5e1' }),
        new IText('Contacto', { left: 510, top: 22, fontSize: 14, fill: '#cbd5e1' }),
      ];
    } else if (type === 'hero') {
      groupObjects = [
        new Rect({ left: 0, top: 0, width: 600, height: 260, fill: '#0f172a', rx: 8, ry: 8 }),
        new IText('Diseña con IA en Tiempo Real', { left: 40, top: 60, fontSize: 26, fill: '#ffffff', fontWeight: 'bold' }),
        new IText('Genera componentes React y Tailwind al instante.', { left: 40, top: 110, fontSize: 15, fill: '#94a3b8' }),
        new Rect({ left: 40, top: 160, width: 140, height: 42, fill: '#2563eb', rx: 6, ry: 6 }),
        new IText('Empezar Ahora', { left: 62, top: 173, fontSize: 14, fill: '#ffffff', fontWeight: 'bold' }),
      ];
    } else if (type === 'button') {
      groupObjects = [
        new Rect({ left: 0, top: 0, width: 140, height: 42, fill: '#3b82f6', rx: 6, ry: 6 }),
        new IText('Botón Acción', { left: 24, top: 12, fontSize: 14, fill: '#ffffff' }),
      ];
    }

    const fabricGroup = new Group(groupObjects, { left: 50, top: 50, canvasaiTemplate: type });
    activeCanvas.add(fabricGroup);
    activeCanvas.setActiveObject(fabricGroup);
    activeCanvas.renderAll();
  };

  const deleteSelected = useCallback(() => {
    const activeCanvas = canvas || fabricCanvasRef.current;
    if (!activeCanvas || !selectedObject) return;

    if (selectedObject.type === 'activeSelection') {
      selectedObject.forEachObject((obj) => activeCanvas.remove(obj));
    } else {
      activeCanvas.remove(selectedObject);
    }
    activeCanvas.discardActiveObject();
    activeCanvas.renderAll();
    setSelectedObject(null);
    setQuickToolbarPosition(null);
  }, [canvas, selectedObject, setSelectedObject]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeTab !== 'canvas' || !selectedObject) return;
      const active = document.activeElement;
      const isTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
      if (isTyping) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, selectedObject, deleteSelected]);

  const cloneSelected = async () => {
    const activeCanvas = canvas || fabricCanvasRef.current;
    if (!activeCanvas || !selectedObject) return;
    try {
      const cloned = await selectedObject.clone();
      cloned.set({ left: cloned.left + 20, top: cloned.top + 20, evented: true });
      if (cloned.type === 'activeSelection') {
        cloned.canvas = activeCanvas;
        cloned.forEachObject((obj) => activeCanvas.add(obj));
        cloned.setCoords();
      } else {
        activeCanvas.add(cloned);
      }
      activeCanvas.setActiveObject(cloned);
      setSelectedObject(cloned);
      activeCanvas.requestRenderAll();
    } catch {
      showToast('No se pudo duplicar el elemento', 'error');
    }
  };

  const bringForward = () => {
    const activeCanvas = canvas || fabricCanvasRef.current;
    if (!activeCanvas || !selectedObject) return;
    if (typeof selectedObject.bringForward === 'function') selectedObject.bringForward();
    activeCanvas.renderAll();
  };

  const sendBackward = () => {
    const activeCanvas = canvas || fabricCanvasRef.current;
    if (!activeCanvas || !selectedObject) return;
    if (typeof selectedObject.sendBackwards === 'function') selectedObject.sendBackwards();
    activeCanvas.renderAll();
  };

  const clearCanvas = () => {
    const activeCanvas = canvas || fabricCanvasRef.current;
    if (!activeCanvas) return;
    if (!window.confirm('¿Quieres limpiar todos los elementos del lienzo?')) return;
    activeCanvas.clear();
    activeCanvas.set('backgroundColor', '#0f172a');
    activeCanvas.renderAll();
    setSelectedObject(null);
    setQuickToolbarPosition(null);
  };

  const updateProp = (prop, value) => {
    const activeCanvas = canvas || fabricCanvasRef.current;
    if (!activeCanvas || !selectedObject) return;

    if (prop === 'text' && ['i-text', 'textbox', 'text'].includes(selectedObject.type)) {
      selectedObject.set({ text: value });
    } else {
      selectedObject.set({ [prop]: value });
    }

    activeCanvas.renderAll();
    setUpdateTrigger((prev) => prev + 1);
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

  const getColorProp = (prop, defaultVal) => {
    const value = getProp(prop, defaultVal);
    return typeof value === 'string' && /^#[\da-f]{6}$/i.test(value) ? value : defaultVal;
  };

  const isTextSelection = ['textbox', 'i-text', 'text'].includes(selectedObject?.type);
  const handleExportProjectToN8N = async () => {
    const activeCanvas = canvas || fabricCanvasRef.current;
    const canvasData = serializeCanvasForAI(activeCanvas);
    setIsExportingN8N(true);
    setN8nStatusMsg('Cargando...');
    try {
      const result = await n8nService.sendProjectExportWebhook({
        id: `canvasai-${currentUser?.id || 'project'}-${Date.now()}`,
        title: promptText || 'Proyecto CanvasAI',
        prompt: promptText,
        code: generatedCode,
        canvasData,
        metadata: {
          canvasWidth: canvasData.canvas.width,
          canvasHeight: canvasData.canvas.height,
          objectCount: canvasData.objects.length,
          exportedAt: new Date().toISOString(),
        },
      });
      if (result.success) {
        showToast('Proyecto exportado a n8n exitosamente.', 'check_circle');
        setN8nStatusMsg('¡Enviado a n8n!');
      } else {
        showToast(getErrorMessage(result.error, 'No se pudo exportar el proyecto a n8n.'), 'error');
        setN8nStatusMsg('Error en n8n');
      }
    } catch (error) {
      showToast(getErrorMessage(error, 'Error de red al conectar con n8n.'), 'error');
      setN8nStatusMsg('Error de red');
    } finally {
      setIsExportingN8N(false);
      setTimeout(() => setN8nStatusMsg(''), 4000);
    }
  };

  const handleGenerateUI = async (e) => {
    e?.preventDefault();
    const activeCanvas = canvas || fabricCanvasRef.current;

    if (!promptText.trim() && (!activeCanvas || activeCanvas.getObjects().length === 0)) {
      showToast('Dibuja algo en el lienzo o escribe una descripción.', 'warning');
      return;
    }

    setIsGenerating(true);
    showToast('Generando la interfaz...', 'auto_awesome');

    try {
      const result = await n8nService.triggerWorkflow({
        prompt: `${promptText}\n\nDevuelve únicamente HTML válido y bien formateado, con clases Tailwind CSS. No incluyas JavaScript, scripts ni explicaciones.`,
      });

      if (!result.success) {
        showToast(getErrorMessage(result.error, 'No se pudo generar la interfaz.'), 'error');
        return;
      }

      const markup = extractPureCode(result.data?.jsxCode);
      if (!markup || !/<[a-z][\w:-]*(?:\s|>|\/)/i.test(markup)) {
        showToast('Gemini no devolvió markup HTML válido. Ajusta el prompt e inténtalo de nuevo.', 'error');
        return;
      }

      setGeneratedCode(markup);
      setActiveTab('iframe');
      showToast('Interfaz generada.', 'verified');
    } catch (error) {
      showToast(getErrorMessage(error, 'Error inesperado al conectar con el servicio de generación.'), 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('El portapapeles no está disponible.');
      await navigator.clipboard.writeText(formatGeneratedCode());
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      showToast('¡Código copiado al portapapeles!', 'content_copy');
    } catch {
      showToast('No se pudo copiar el código. Comprueba los permisos del navegador.', 'error');
    }
  };

  const iframeDocument = `
<!DOCTYPE html>
<html class="dark">
<head>
  <meta charset="utf-8"/>
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src https://cdn.tailwindcss.com; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; object-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'"/>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #0b1326; color: #dae2fd; padding: 1.5rem; }
    img { max-width: 100%; height: auto; max-height: 200px; object-fit: cover; border-radius: 0.5rem; }
  </style>
</head>
<body class="min-h-screen flex items-center justify-center">
  ${sanitizeJsxForIframe(generatedCode) || '<div class="text-slate-500">Dibuja en el lienzo y presiona "Generar UI" para visualizar el código sintetizado.</div>'}
</body>
</html>`;

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden text-on-surface bg-surface">
      <header className="h-14 bg-surface-container-low border-b border-outline-variant/30 px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow">
              <span className="material-symbols-outlined text-black font-bold text-xl">terminal</span>
            </div>
            <span className="font-headline-sm text-lg font-bold">CanvasAI Studio</span>
          </Link>
        </div>

        <div className="flex items-center gap-1 p-1 bg-surface-container-lowest rounded-lg border border-outline-variant/20" role="tablist">
          <button role="tab" aria-selected={activeTab === 'canvas'} onClick={() => setActiveTab('canvas')} className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${activeTab === 'canvas' ? 'bg-primary text-black shadow' : 'text-on-surface-variant hover:text-on-surface'}`}>
            Lienzo
          </button>
          <button role="tab" aria-selected={activeTab === 'iframe'} onClick={() => setActiveTab('iframe')} className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${activeTab === 'iframe' ? 'bg-primary text-black shadow' : 'text-on-surface-variant hover:text-on-surface'}`}>
            Iframe
          </button>
          <button role="tab" aria-selected={activeTab === 'code'} onClick={() => setActiveTab('code')} className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${activeTab === 'code' ? 'bg-primary text-black shadow' : 'text-on-surface-variant hover:text-on-surface'}`}>
            Código
          </button>
        </div>

        <div className="flex items-center gap-3">
          <AccessibilityToolbar />
          <div className="flex items-center gap-2">
            <button onClick={handleExportProjectToN8N} disabled={isExportingN8N} aria-busy={isExportingN8N} className="px-3 py-1 rounded-md bg-secondary-container/30 border border-secondary/40 text-secondary text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-secondary-container/50 transition disabled:opacity-60">
              <span className="material-symbols-outlined text-base">hub</span> {isExportingN8N ? 'Cargando...' : 'Exportar N8N'}
            </button>
            {n8nStatusMsg && <span className="text-[10px] text-outline">{n8nStatusMsg}</span>}
          </div>
          <button onClick={handleLogout} className="text-xs text-outline px-2.5 py-1 rounded border border-outline-variant/20 hover:bg-surface-container-high transition">Salir</button>
        </div>
      </header>

      <CanvasErrorBoundary>
        <div className="flex-1 flex overflow-hidden">
          {/* Panel Izquierdo */}
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
                  <span className="material-symbols-outlined text-secondary">title</span> Texto
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

          {/* Lienzo Central */}
          <div className="flex-1 bg-surface-dim relative flex flex-col h-full overflow-hidden">
            {activeTab === 'canvas' && (
              <div className="h-12 border-b border-outline-variant/30 flex items-center justify-between px-4 bg-surface-container-lowest shrink-0">
                <div className="flex items-center gap-2">
                  <button onClick={deleteSelected} disabled={!selectedObject} className="p-1.5 rounded hover:bg-surface-container-high disabled:opacity-30 text-error transition" title="Eliminar">
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                  <button onClick={cloneSelected} disabled={!selectedObject} className="p-1.5 rounded hover:bg-surface-container-high disabled:opacity-30 text-on-surface transition" title="Duplicar">
                    <span className="material-symbols-outlined text-lg">content_copy</span>
                  </button>
                  <div className="w-px h-5 bg-outline-variant/40 mx-1"></div>
                  <button onClick={bringForward} disabled={!selectedObject} className="p-1.5 rounded hover:bg-surface-container-high disabled:opacity-30 text-on-surface transition" title="Traer al frente">
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
              {isGenerating && (
                <div className="absolute inset-4 z-40 flex flex-col items-center justify-center gap-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest/95 p-8 backdrop-blur-sm" role="status" aria-live="polite">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                  <div className="w-full max-w-md space-y-3">
                    <p className="text-center text-sm font-semibold text-on-surface">Gemini está diseñando tu interfaz…</p>
                    <div className="h-3 animate-pulse rounded bg-surface-container-high" />
                    <div className="h-3 w-4/5 animate-pulse rounded bg-surface-container-high" />
                    <div className="h-24 animate-pulse rounded-lg bg-surface-container-high" />
                  </div>
                </div>
              )}
              <div ref={canvasStageRef} className="relative w-full h-full border border-dashed border-outline-variant/40 rounded-xl overflow-hidden shadow-inner justify-center items-center bg-surface-container-lowest/50" style={{ display: activeTab === 'canvas' ? 'flex' : 'none' }}>
                {selectedObject && quickToolbarPosition && (
                  <div className="absolute z-30 flex -translate-x-1/2 -translate-y-full items-center gap-1 rounded-lg border border-outline-variant/40 bg-surface-container-highest/95 p-1.5 shadow-xl backdrop-blur-md" style={{ left: quickToolbarPosition.left, top: quickToolbarPosition.top - 8 }} onMouseDown={(event) => event.stopPropagation()}>
                    <button type="button" onClick={cloneSelected} className="rounded-md p-1.5 text-on-surface hover:bg-surface-container-high" title="Duplicar"><span className="material-symbols-outlined text-lg">content_copy</span></button>
                    <button type="button" onClick={deleteSelected} className="rounded-md p-1.5 text-error hover:bg-error-container/30" title="Eliminar"><span className="material-symbols-outlined text-lg">delete</span></button>
                  </div>
                )}
                <div className="flex h-full w-full items-center justify-center">
                  <canvas ref={canvasRef} />
                </div>
              </div>

              {activeTab === 'iframe' && (
                <div className="w-full h-full rounded-xl border border-outline-variant/30 overflow-hidden bg-black flex items-center justify-center">
                  <iframe srcDoc={iframeDocument} title="Preview UI" className="w-full h-full border-none" sandbox="allow-scripts" referrerPolicy="no-referrer" />
                </div>
              )}

              {activeTab === 'code' && (
                <div className="w-full h-full flex flex-col rounded-xl border border-outline-variant/30 bg-[#1e1e1e] overflow-hidden shadow-lg">
                  <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-outline text-sm">code</span>
                      <span className="text-xs font-mono text-outline">{codeViewMode === 'jsx' ? 'GeneratedUI.jsx' : 'index.html'}</span>
                      <div className="flex bg-black/40 rounded p-0.5 ml-4">
                        <button onClick={() => setCodeViewMode('jsx')} className={`px-2 py-1 text-[10px] font-semibold rounded uppercase transition ${codeViewMode === 'jsx' ? 'bg-[#3b82f6] text-white' : 'text-gray-400 hover:text-white'}`}>JSX</button>
                        <button onClick={() => setCodeViewMode('html')} className={`px-2 py-1 text-[10px] font-semibold rounded uppercase transition ${codeViewMode === 'html' ? 'bg-[#10b981] text-white' : 'text-gray-400 hover:text-white'}`}>HTML</button>
                      </div>
                    </div>
                    <button onClick={copyToClipboard} aria-label={isCopied ? 'Código copiado' : 'Copiar Código'} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition">
                      <span className="material-symbols-outlined text-[14px]">{isCopied ? 'check' : 'content_copy'}</span>
                      {isCopied ? '¡Copiado!' : 'Copiar Código'}
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto p-4 flex">
                    <div className="text-right pr-4 border-r border-white/10 select-none text-gray-600 font-mono text-xs w-10 shrink-0">
                      {generatedCode ? generatedCode.split('\n').map((_, i) => <div key={i}>{i + 1}</div>) : <div>1</div>}
                    </div>
                    <pre className="text-xs font-mono text-gray-300 flex-1 pl-4 overflow-x-auto whitespace-pre">
                      {generatedCode ? formatGeneratedCode() : '// Dibuja en el lienzo y presiona "Generar UI"'}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleGenerateUI} className="p-4 bg-surface-container-low border-t border-outline-variant/30 shrink-0">
              <div className="max-w-4xl mx-auto flex items-center gap-3">
                <input
                  type="text"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Describe qué quieres generar (ej. Tarjeta de perfil oscura)..."
                  className="flex-1 bg-surface-container-highest border border-outline-variant/50 rounded-lg px-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition"
                />
                <button type="submit" disabled={isGenerating} className="px-6 py-2 rounded-lg bg-primary text-black font-bold text-sm flex items-center gap-2 hover:opacity-90 transition disabled:opacity-50 cursor-pointer shadow">
                  <span className="text-black font-bold">{isGenerating ? 'Generando...' : 'Generar UI'}</span>
                  <span className="material-symbols-outlined text-[18px] text-black font-bold">auto_awesome</span>
                </button>
              </div>
            </form>
          </div>

          {/* Panel Derecho */}
          {activeTab === 'canvas' && (
            <div className="w-72 bg-surface-container-low border-l border-outline-variant/30 flex flex-col shrink-0 overflow-y-auto">
              <div className="p-4 border-b border-outline-variant/20 font-semibold text-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined">tune</span> Propiedades
              </div>

              {!selectedObject ? (
                <div className="p-6 text-center text-xs text-outline">Selecciona un elemento para editarlo.</div>
              ) : (
                <div className="p-4 space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                    <div>
                      <p className="text-[10px] uppercase text-outline">Tipo</p>
                      <p className="font-semibold text-on-surface">{selectedObject.type}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block space-y-1">
                      <span className="text-outline font-semibold">Relleno</span>
                      <div className="flex gap-2">
                        <input aria-label="Color de relleno" type="color" value={getColorProp('fill', isTextSelection ? '#ffffff' : '#3b82f6')} onChange={(e) => updateProp('fill', e.target.value)} className="h-9 w-10 cursor-pointer rounded border-none bg-transparent" />
                        <input aria-label="Valor del color de relleno" type="text" value={typeof getProp('fill', '') === 'string' ? getProp('fill', '') : ''} onChange={(e) => updateProp('fill', e.target.value)} className="min-w-0 flex-1 rounded border border-outline-variant/50 bg-surface-container-highest px-2 text-on-surface" />
                      </div>
                    </label>
                    <label className="block space-y-1">
                      <span className="text-outline font-semibold">Color de borde</span>
                      <input aria-label="Color de borde" type="color" value={getColorProp('stroke', '#000000')} onChange={(e) => updateProp('stroke', e.target.value)} className="h-9 w-12 cursor-pointer rounded border-none bg-transparent" />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-outline font-semibold">Grosor de borde</span>
                      <input aria-label="Grosor de borde" type="number" min="0" max="40" value={getProp('strokeWidth', 0)} onChange={(e) => updateProp('strokeWidth', Math.max(0, Number(e.target.value) || 0))} className="w-full rounded border border-outline-variant/50 bg-surface-container-highest p-2 text-on-surface" />
                    </label>
                  </div>

                  {isTextSelection && (
                    <div className="space-y-3 border-t border-outline-variant/20 pt-3">
                      <label className="block space-y-1">
                        <span className="text-outline font-semibold">Texto</span>
                        <textarea aria-label="Contenido del texto" value={getProp('text', '')} onChange={(e) => updateProp('text', e.target.value)} className="w-full rounded border border-outline-variant/50 bg-surface-container-highest p-2 text-on-surface focus:outline-none" />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-outline font-semibold">Fuente</span>
                        <select aria-label="Fuente" value={getProp('fontFamily', 'Inter')} onChange={(e) => updateProp('fontFamily', e.target.value)} className="w-full rounded border border-outline-variant/50 bg-surface-container-highest p-2 text-on-surface">
                          {['Inter', 'Arial', 'Georgia', 'Times New Roman', 'Courier New', 'sans-serif', 'serif', 'monospace'].map((font) => <option key={font} value={font}>{font}</option>)}
                        </select>
                      </label>
                      <label className="block space-y-1">
                        <span className="text-outline font-semibold">Tamaño de fuente</span>
                        <input aria-label="Tamaño de fuente" type="number" min="1" max="200" value={getProp('fontSize', 16)} onChange={(e) => updateProp('fontSize', Math.max(1, Number(e.target.value) || 1))} className="w-full rounded border border-outline-variant/50 bg-surface-container-highest p-2 text-on-surface" />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-outline font-semibold">Alineación</span>
                        <select aria-label="Alineación del texto" value={getProp('textAlign', 'left')} onChange={(e) => updateProp('textAlign', e.target.value)} className="w-full rounded border border-outline-variant/50 bg-surface-container-highest p-2 text-on-surface">
                          {['left', 'center', 'right', 'justify'].map((alignment) => <option key={alignment} value={alignment}>{alignment}</option>)}
                        </select>
                      </label>
                      <label className="block space-y-1">
                        <span className="text-outline font-semibold">Peso</span>
                        <select aria-label="Peso de fuente" value={String(getProp('fontWeight', 'normal'))} onChange={(e) => updateProp('fontWeight', e.target.value)} className="w-full rounded border border-outline-variant/50 bg-surface-container-highest p-2 text-on-surface">
                          <option value="normal">Normal</option>
                          <option value="500">Medium</option>
                          <option value="600">Semibold</option>
                          <option value="bold">Negrita</option>
                        </select>
                      </label>
                    </div>
                  )}

                  {!isTextSelection && selectedObject.type === 'rect' && (
                    <label className="block space-y-1">
                      <span className="text-outline font-semibold">Radio (bordes)</span>
                      <input aria-label="Radio de borde" type="number" min="0" value={getProp('rx', 0)} onChange={(e) => { const radius = Math.max(0, Number(e.target.value) || 0); updateProp('rx', radius); updateProp('ry', radius); }} className="w-full rounded border border-outline-variant/50 bg-surface-container-highest p-2 text-on-surface" />
                    </label>
                  )}

                  <div className="space-y-1 border-t border-outline-variant/20 pt-3">
                    <div className="flex justify-between">
                      <label htmlFor="object-opacity" className="text-outline font-semibold">Opacidad</label>
                      <span>{Math.round(getProp('opacity', 1) * 100)}%</span>
                    </div>
                    <input id="object-opacity" aria-label="Opacidad" type="range" min="0" max="1" step="0.05" value={getProp('opacity', 1)} onChange={(e) => updateProp('opacity', parseFloat(e.target.value))} className="w-full accent-primary" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CanvasErrorBoundary>
      <ToastNotification show={toastState.show} message={toastState.message} icon={toastState.icon} />
    </div>
  );
};

export default CanvasCopilotPage;