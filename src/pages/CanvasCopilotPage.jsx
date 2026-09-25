import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Canvas, Rect, Circle, IText, Group, Shadow } from 'fabric';
import { authService } from '../services/authService';
import { mistralService } from '../services/mistralService';
import { n8nService } from '../services/n8nService';
import { AccessibilityToolbar } from '../components/AccessibilityToolbar';
import { ToastNotification } from '../components/ToastNotification';
import { CanvasErrorBoundary } from '../components/CanvasErrorBoundary';
import { useSelection } from '../context/useSelection';

const SHADOW_PRESETS = {
  soft: { offsetX: 0, offsetY: 2, blur: 8, css: 'rgba(0,0,0,0.24) 0px 2px 8px' },
  strong: { offsetX: 0, offsetY: 8, blur: 20, css: 'rgba(0,0,0,0.4) 0px 8px 20px' },
};

export const CanvasCopilotPage = () => {
  const navigate = useNavigate();
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
    setToastState({ show: true, message, icon });
    setTimeout(() => setToastState((prev) => ({ ...prev, show: false })), 4000);
  };

  const extractPureCode = (rawText) => {
    if (!rawText) return '';
    let textToProcess = rawText;
    try {
      const parsed = JSON.parse(rawText);
      if (typeof parsed === 'string') textToProcess = parsed;
      else if (parsed.output) textToProcess = parsed.output;
      else if (parsed.text) textToProcess = parsed.text;
    } catch {
      // No es JSON, continuar con texto plano
    }

    const jsxMatch = textToProcess.match(/```(?:jsx|html|javascript)?\s*([\s\S]*?)```/i);
    if (jsxMatch && jsxMatch[1]) {
      return jsxMatch[1].trim();
    }
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
      .replace(/import\s+.*?;/g, '')
      .replace(/export\s+default\s+.*?;?/g, '')
      .replace(/const\s+\w+\s*=\s*\(\)\s*=>\s*\{/g, '')
      .replace(/function\s+\w+\s*\(\)\s*\{/g, '')
      .replace(/return\s*\(/g, '')
      .replace(/\);\s*\}\s*$/g, '')
      .replace(/className=/g, 'class=')
      .replace(/\{(\/\*.*?\*\/)\}/g, '');
  };

  const canvasRef = useRef(null);
  const canvasStageRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const { selectedObject, setSelectedObject } = useSelection();
  const [, setUpdateTrigger] = useState(0);
  const [quickToolbarPosition, setQuickToolbarPosition] = useState(null);

  const currentUser = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  const disposePromiseRef = useRef(Promise.resolve());

  const queueCanvasDispose = (canvasToDispose) => {
    if (!canvasToDispose) return;
    disposePromiseRef.current = Promise.resolve()
      .then(() => canvasToDispose.dispose())
      .catch(() => undefined);
  };

  // --- INICIALIZACIÓN ROBUSTA DE FABRIC V6 ---
  useEffect(() => {
    if (!canvasRef.current) return;

    let cancelled = false;
    let initCanvas = null;
    let resizeObserver = null;

    const setup = async () => {
      try {
        await disposePromiseRef.current;
      } catch {
        // Ignorar errores de dispose previos
      }

      if (cancelled || !canvasRef.current) return;

      const canvasElement = canvasRef.current;

      // Limpieza preventiva si el elemento conserva propiedades o contexto previos de Fabric.
      if (canvasElement.__fabric) {
        try {
          delete canvasElement.__fabric;
        } catch (error) {
          console.warn('No se pudo limpiar la referencia previa de Fabric:', error);
        }
      }

      // Restablecer el contexto 2D después de esperar a dispose() evita conflictos en Strict Mode.
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
      } catch (err) {
        console.warn('Advertencia durante la creación del Canvas de Fabric:', err);
        return;
      }

      if (cancelled) {
        queueCanvasDispose(initCanvas);
        initCanvas = null;
        return;
      }

      try {
        fabricCanvasRef.current = initCanvas;
        attachCanvasBehavior(initCanvas, container, canvasStageRef.current);
      } catch (error) {
        console.warn('Advertencia durante la configuración del Canvas de Fabric:', error);
        fabricCanvasRef.current = null;
        queueCanvasDispose(initCanvas);
        initCanvas = null;
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

      if (container) {
        resizeObserver.observe(container);
      }
    };

    setup();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      const toDispose = fabricCanvasRef.current || initCanvas;
      fabricCanvasRef.current = null;
      queueCanvasDispose(toDispose);
      initCanvas = null;
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
    const text = new IText('Texto Editable', {
      left: 120,
      top: 120,
      fontSize: 20,
      fill: '#ffffff',
      fontFamily: 'Inter',
    });
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

    const fabricGroup = new Group(groupObjects, { left: 50, top: 50 });
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
    if (typeof selectedObject.bringForward === 'function') {
      selectedObject.bringForward();
    }
    activeCanvas.renderAll();
  };

  const sendBackward = () => {
    const activeCanvas = canvas || fabricCanvasRef.current;
    if (!activeCanvas || !selectedObject) return;
    if (typeof selectedObject.sendBackwards === 'function') {
      selectedObject.sendBackwards();
    }
    activeCanvas.renderAll();
  };

  const clearCanvas = () => {
    const activeCanvas = canvas || fabricCanvasRef.current;
    if (!activeCanvas) return;
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

  const isTextSelection = ['textbox', 'i-text', 'text'].includes(selectedObject?.type);
  const shadowValue = getProp('shadow', null);
  const shadowPreset = (() => {
    if (!shadowValue) return 'none';
    const { offsetX, offsetY, blur } = shadowValue;
    if (offsetX === SHADOW_PRESETS.soft.offsetX && offsetY === SHADOW_PRESETS.soft.offsetY && blur === SHADOW_PRESETS.soft.blur) return 'soft';
    if (offsetX === SHADOW_PRESETS.strong.offsetX && offsetY === SHADOW_PRESETS.strong.offsetY && blur === SHADOW_PRESETS.strong.blur) return 'strong';
    return 'custom';
  })();

  const updateShadow = (value) => {
    if (value === 'none') {
      updateProp('shadow', null);
      return;
    }
    if (value === 'custom') return;
    updateProp('shadow', new Shadow(SHADOW_PRESETS[value].css));
  };

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
    } catch {
      showToast('Error de red al conectar con n8n', 'error');
      setN8nStatusMsg('Error de red');
    } finally {
      setIsExportingN8N(false);
      setTimeout(() => setN8nStatusMsg(''), 4000);
    }
  };

  // Generación flexible: permite generar si hay prompt, incluso con canvas vacío
  const handleGenerateUI = async (e) => {
    e?.preventDefault();
    const activeCanvas = canvas || fabricCanvasRef.current;

    if (!promptText.trim() && (!activeCanvas || activeCanvas.getObjects().length === 0)) {
      showToast('Dibuja algo en el lienzo o escribe una descripción.', 'warning');
      return;
    }

    setIsGenerating(true);
    showToast('Generando UI...', 'auto_awesome');

    try {
      const hasCanvasObjects = Boolean(activeCanvas && activeCanvas.getObjects().length > 0);
      const canvasJSON = hasCanvasObjects ? activeCanvas.toJSON() : {};
      const payload = {
        prompt: promptText,
        canvasJson: canvasJSON,
        user: currentUser,
      };

      let result = await n8nService.triggerWorkflow(payload);

      let pureCode = '';
      if (result.success && result.data) {
        const rawCode = typeof result.data.jsxCode === 'string' ? result.data.jsxCode : JSON.stringify(result.data.jsxCode);
        pureCode = extractPureCode(rawCode);
      }

      if (!pureCode) {
        showToast('N8n sin respuesta, conectando con Mistral AI...', 'sync');
        result = await mistralService.generateUIFromPrompt(promptText, JSON.stringify(canvasJSON));
        if (result.success && result.data) {
          const rawCode = typeof result.data.jsxCode === 'string' ? result.data.jsxCode : JSON.stringify(result.data.jsxCode);
          pureCode = extractPureCode(rawCode);
        }
      }

      if (pureCode) {
        setGeneratedCode(pureCode);
        setActiveTab('iframe');
        showToast('UI Generada con éxito', 'verified');
      } else {
        showToast(result.error || 'No se pudo generar código a partir del prompt proporcionado.', 'error');
      }
    } catch {
      showToast('Error inesperado al generar la UI', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    const textToCopy = codeViewMode === 'html' ? sanitizeJsxForIframe(generatedCode) : generatedCode;
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        showToast('¡Código copiado al portapapeles!', 'content_copy');
      })
      .catch(() => {
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
      <header className="h-14 bg-surface-container-low border-b border-outline-variant/30 px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow">
              <span className="material-symbols-outlined text-on-primary text-xl">terminal</span>
            </div>
            <span className="font-headline-sm text-lg font-bold">CanvasAI Studio</span>
          </Link>
        </div>

        <div className="flex items-center gap-1 p-1 bg-surface-container-lowest rounded-lg border border-outline-variant/20" role="tablist" aria-label="Vistas del editor">
          <button
            role="tab"
            aria-selected={activeTab === 'canvas'}
            onClick={() => setActiveTab('canvas')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === 'canvas' ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant'}`}
          >
            Lienzo
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'iframe'}
            onClick={() => setActiveTab('iframe')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === 'iframe' ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant'}`}
          >
            Iframe
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'code'}
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === 'code' ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant'}`}
          >
            Código
          </button>
        </div>

        <div className="flex items-center gap-3">
          <AccessibilityToolbar />
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportProjectToN8N}
              disabled={isExportingN8N}
              className="px-3 py-1 rounded-md bg-secondary-container/30 border border-secondary/40 text-secondary text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-secondary-container/50 transition disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-base">hub</span> {isExportingN8N ? 'Enviando...' : 'Exportar N8N'}
            </button>
            {n8nStatusMsg && <span className="text-[10px] text-outline" role="status">{n8nStatusMsg}</span>}
          </div>
          <button onClick={handleLogout} className="text-xs text-outline px-2.5 py-1 rounded border border-outline-variant/20 hover:bg-surface-container-high transition">
            Salir
          </button>
        </div>
      </header>

      <CanvasErrorBoundary>
        <div className="flex-1 flex overflow-hidden">
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

          <div className="flex-1 bg-surface-dim relative flex flex-col h-full overflow-hidden">
            {activeTab === 'canvas' && (
              <div className="h-12 border-b border-outline-variant/30 flex items-center justify-between px-4 bg-surface-container-lowest shrink-0">
                <div className="flex items-center gap-2">
                  <button onClick={deleteSelected} disabled={!selectedObject} aria-label="Eliminar seleccionado" className="p-1.5 rounded hover:bg-surface-container-high disabled:opacity-30 text-error transition" title="Eliminar seleccionado">
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                  <button onClick={cloneSelected} disabled={!selectedObject} aria-label="Duplicar" className="p-1.5 rounded hover:bg-surface-container-high disabled:opacity-30 text-on-surface transition" title="Duplicar">
                    <span className="material-symbols-outlined text-lg">content_copy</span>
                  </button>
                  <div className="w-px h-5 bg-outline-variant/40 mx-1"></div>
                  <button onClick={bringForward} disabled={!selectedObject} aria-label="Traer adelante" className="p-1.5 rounded hover:bg-surface-container-high disabled:opacity-30 text-on-surface transition" title="Traer adelante">
                    <span className="material-symbols-outlined text-lg">flip_to_front</span>
                  </button>
                  <button onClick={sendBackward} disabled={!selectedObject} aria-label="Enviar atrás" className="p-1.5 rounded hover:bg-surface-container-high disabled:opacity-30 text-on-surface transition" title="Enviar atrás">
                    <span className="material-symbols-outlined text-lg">flip_to_back</span>
                  </button>
                </div>
                <button onClick={clearCanvas} className="flex items-center gap-1 px-3 py-1.5 rounded text-xs text-error bg-error-container/20 hover:bg-error-container/40 font-semibold transition">
                  <span className="material-symbols-outlined text-[16px]">mop</span> Limpiar
                </button>
              </div>
            )}

            <div className="flex-1 relative overflow-auto p-4 w-full h-full flex items-center justify-center">
              <div
                ref={canvasStageRef}
                className="relative w-full h-full border border-dashed border-outline-variant/40 rounded-xl overflow-hidden shadow-inner justify-center items-center bg-surface-container-lowest/50"
                style={{ minHeight: '500px', display: activeTab === 'canvas' ? 'flex' : 'none' }}
              >
                {selectedObject && quickToolbarPosition && (
                  <div
                    className="absolute z-30 flex -translate-x-1/2 -translate-y-full items-center gap-1 rounded-lg border border-outline-variant/40 bg-surface-container-highest/95 p-1.5 shadow-xl backdrop-blur-md"
                    style={{ left: quickToolbarPosition.left, top: quickToolbarPosition.top - 8 }}
                    role="toolbar"
                    aria-label="Acciones del elemento seleccionado"
                    onMouseDown={(event) => event.stopPropagation()}
                  >
                    <button type="button" onClick={cloneSelected} className="rounded-md p-1.5 text-on-surface transition hover:bg-surface-container-high" title="Duplicar">
                      <span className="material-symbols-outlined text-lg">content_copy</span>
                    </button>
                    <button type="button" onClick={deleteSelected} className="rounded-md p-1.5 text-error transition hover:bg-error-container/30" title="Eliminar">
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                    <span className="mx-0.5 h-5 w-px bg-outline-variant/40" />
                    <button type="button" onClick={bringForward} className="rounded-md p-1.5 text-on-surface transition hover:bg-surface-container-high" title="Traer al frente">
                      <span className="material-symbols-outlined text-lg">flip_to_front</span>
                    </button>
                    <button type="button" onClick={sendBackward} className="rounded-md p-1.5 text-on-surface transition hover:bg-surface-container-high" title="Enviar atrás">
                      <span className="material-symbols-outlined text-lg">flip_to_back</span>
                    </button>
                  </div>
                )}
                <div className="flex h-full w-full items-center justify-center">
                  <canvas ref={canvasRef} />
                </div>
              </div>

              {activeTab === 'iframe' && (
                <div className="w-full h-full rounded-xl border border-outline-variant/30 overflow-hidden">
                  <iframe
                    srcDoc={iframeDocument}
                    title="Preview UI"
                    className="w-full h-full bg-black border-none"
                    sandbox="allow-scripts"
                  />
                </div>
              )}

              {activeTab === 'code' && (
                <div className="w-full h-full flex flex-col rounded-xl border border-outline-variant/30 bg-[#1e1e1e] overflow-hidden shadow-lg">
                  <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-outline text-sm">code</span>
                      <span className="text-xs font-mono text-outline">{codeViewMode === 'jsx' ? 'GeneratedComponent.jsx' : 'index.html'}</span>
                      <div className="flex bg-black/40 rounded p-0.5 ml-4">
                        <button onClick={() => setCodeViewMode('jsx')} className={`px-2 py-1 text-[10px] font-semibold rounded uppercase transition ${codeViewMode === 'jsx' ? 'bg-[#3b82f6] text-white' : 'text-gray-400 hover:text-white'}`}>
                          JSX / React
                        </button>
                        <button onClick={() => setCodeViewMode('html')} className={`px-2 py-1 text-[10px] font-semibold rounded uppercase transition ${codeViewMode === 'html' ? 'bg-[#10b981] text-white' : 'text-gray-400 hover:text-white'}`}>
                          HTML Puro
                        </button>
                      </div>
                    </div>
                    <button onClick={copyToClipboard} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition">
                      <span className="material-symbols-outlined text-[14px]">{isCopied ? 'check' : 'content_copy'}</span>
                      {isCopied ? '¡Copiado!' : 'Copiar Código'}
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto p-4 flex">
                    <div className="text-right pr-4 border-r border-white/10 select-none text-gray-600 font-mono text-xs w-10 shrink-0">
                      {generatedCode
                        ? generatedCode.split('\n').map((_, i) => <div key={i}>{i + 1}</div>)
                        : <div>1</div>}
                    </div>
                    <pre className="text-xs font-mono text-gray-300 flex-1 pl-4 overflow-x-auto whitespace-pre">
                      {generatedCode
                        ? codeViewMode === 'html'
                          ? sanitizeJsxForIframe(generatedCode)
                          : generatedCode
                        : '// Dibuja en el lienzo y presiona "Generar UI"\n// El código limpio aparecerá aquí.'}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleGenerateUI} className="p-4 bg-surface-container-low border-t border-outline-variant/30 shrink-0">
              <div className="max-w-4xl mx-auto flex items-center gap-3">
                <label htmlFor="ui-prompt" className="sr-only">Descripción de la UI a generar</label>
                <input
                  id="ui-prompt"
                  type="text"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Describe qué quieres generar a partir del lienzo..."
                  className="flex-1 bg-surface-container-highest border border-outline-variant/50 rounded-lg px-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition"
                />
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-6 py-2 rounded-lg bg-primary text-on-primary font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition disabled:opacity-50"
                >
                  {isGenerating ? 'Generando...' : 'Generar UI'} <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                </button>
              </div>
            </form>
          </div>

          {activeTab === 'canvas' && (
            <div className="w-72 bg-surface-container-low border-l border-outline-variant/30 flex flex-col shrink-0 overflow-y-auto">
              <div className="p-4 border-b border-outline-variant/20 font-semibold text-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined">tune</span> Personalizar Elemento
              </div>

              {!selectedObject ? (
                <div className="p-6 text-center text-xs text-outline">Selecciona un elemento en el lienzo para ver sus propiedades.</div>
              ) : (
                <div className="p-4 space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-outline">Elemento seleccionado</p>
                      <p className="font-semibold text-on-surface">{isTextSelection ? 'Texto' : 'Contenedor / botón'}</p>
                    </div>
                    <span className="rounded bg-primary/15 px-2 py-1 text-[10px] font-semibold text-primary">{selectedObject.type}</span>
                  </div>

                  {isTextSelection && (
                    <div className="space-y-1">
                      <label className="text-outline font-semibold" htmlFor="prop-text">Contenido del Texto</label>
                      <textarea
                        id="prop-text"
                        value={getProp('text', '')}
                        onChange={(e) => updateProp('text', e.target.value)}
                        className="w-full bg-surface-container-highest border border-outline-variant/50 rounded p-2 text-on-surface focus:outline-none"
                      />

                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="space-y-1">
                          <label className="text-outline">Tam. Fuente</label>
                          <input type="number" value={getProp('fontSize', 16)} onChange={(e) => updateProp('fontSize', parseInt(e.target.value, 10) || 12)} className="w-full bg-surface-container-highest border border-outline-variant/50 rounded p-1" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-outline">Peso</label>
                          <select value={getProp('fontWeight', 'normal')} onChange={(e) => updateProp('fontWeight', e.target.value)} className="w-full bg-surface-container-highest border border-outline-variant/50 rounded p-1">
                            <option value="normal">Regular</option>
                            <option value="500">Medio</option>
                            <option value="bold">Negrita</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <label className="text-outline">Color del texto</label>
                        <input type="color" value={getProp('fill', '#ffffff')} onChange={(e) => updateProp('fill', e.target.value)} className="h-8 w-10 cursor-pointer rounded border-none bg-transparent" />
                      </div>
                    </div>
                  )}

                  {!isTextSelection && (
                    <div className="space-y-2">
                      <p className="text-outline font-semibold">Apariencia</p>
                      <div className="flex items-center justify-between">
                        <label className="text-outline">Background</label>
                        <input type="color" value={getProp('fill', '#3b82f6')} onChange={(e) => updateProp('fill', e.target.value)} className="h-8 w-10 cursor-pointer rounded border-none bg-transparent" />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-outline">Borde</label>
                        <input type="color" value={getProp('stroke', '#000000')} onChange={(e) => updateProp('stroke', e.target.value)} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="space-y-1">
                          <span className="text-outline">Radio</span>
                          <input
                            type="number"
                            min="0"
                            value={getProp('rx', 0)}
                            onChange={(e) => {
                              const radius = parseInt(e.target.value, 10) || 0;
                              updateProp('rx', radius);
                              updateProp('ry', radius);
                            }}
                            className="w-full bg-surface-container-highest border border-outline-variant/50 rounded p-1"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-outline">Padding</span>
                          <input type="number" min="0" value={getProp('padding', 0)} onChange={(e) => updateProp('padding', parseInt(e.target.value, 10) || 0)} className="w-full bg-surface-container-highest border border-outline-variant/50 rounded p-1" />
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-outline">Sombra</label>
                        <select value={shadowPreset} onChange={(e) => updateShadow(e.target.value)} className="bg-surface-container-highest border border-outline-variant/50 rounded p-1">
                          <option value="none">Sin sombra</option>
                          <option value="soft">Suave</option>
                          <option value="strong">Profunda</option>
                          {shadowPreset === 'custom' && <option value="custom">Personalizada</option>}
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 pt-3 border-t border-outline-variant/20">
                    <label className="text-outline font-semibold">Geometría</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-outline">Ancho</label>
                        <input
                          type="number"
                          value={Math.round(getProp('width', 0) * getProp('scaleX', 1))}
                          onChange={(e) => {
                            updateProp('width', parseInt(e.target.value, 10) || 10);
                            updateProp('scaleX', 1);
                          }}
                          className="w-full bg-surface-container-highest border border-outline-variant/50 rounded p-1"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-outline">Alto</label>
                        <input
                          type="number"
                          value={Math.round(getProp('height', 0) * getProp('scaleY', 1))}
                          onChange={(e) => {
                            updateProp('height', parseInt(e.target.value, 10) || 10);
                            updateProp('scaleY', 1);
                          }}
                          className="w-full bg-surface-container-highest border border-outline-variant/50 rounded p-1"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-outline">Posición X</label>
                        <input type="number" value={Math.round(getProp('left', 0))} onChange={(e) => updateProp('left', parseInt(e.target.value, 10) || 0)} className="w-full bg-surface-container-highest border border-outline-variant/50 rounded p-1" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-outline">Posición Y</label>
                        <input type="number" value={Math.round(getProp('top', 0))} onChange={(e) => updateProp('top', parseInt(e.target.value, 10) || 0)} className="w-full bg-surface-container-highest border border-outline-variant/50 rounded p-1" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 pt-3 border-t border-outline-variant/20">
                    <div className="flex justify-between">
                      <label className="text-outline font-semibold">Opacidad</label>
                      <span>{Math.round(getProp('opacity', 1) * 100)}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.05" value={getProp('opacity', 1)} onChange={(e) => updateProp('opacity', parseFloat(e.target.value))} className="w-full accent-primary" />
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