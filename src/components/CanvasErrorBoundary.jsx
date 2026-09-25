import { Component } from 'react';

export class CanvasErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('Error en el lienzo:', error);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full min-h-[500px] flex-col items-center justify-center gap-3 rounded-xl border border-error/30 bg-surface-container-lowest p-8 text-center">
          <span className="material-symbols-outlined text-3xl text-error">broken_image</span>
          <p className="text-sm font-semibold text-on-surface">No se pudo cargar el lienzo.</p>
          <p className="max-w-sm text-xs text-on-surface-variant">El resto del estudio sigue disponible. Puedes intentar cargar el lienzo de nuevo.</p>
          <button type="button" onClick={this.handleReset} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary transition hover:opacity-90">
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default CanvasErrorBoundary;