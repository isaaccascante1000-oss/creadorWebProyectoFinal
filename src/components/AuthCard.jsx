import { useState } from 'react';
import { authService } from '../services/authService';
import TermsModal from './TermsModal';

export const AuthCard = ({ onShowToast }) => {
  const [loadingProvider, setLoadingProvider] = useState('');
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleOAuth = (provider) => {
    if (!acceptedTerms) {
      onShowToast?.('Acepta los Términos y Condiciones antes de continuar.', 'warning');
      return;
    }
    setLoadingProvider(provider);
    const result = authService.startOAuth(provider, acceptedTerms);
    if (!result.success) {
      setLoadingProvider('');
      onShowToast?.(result.error, 'error');
    }
  };

  return (
    <div className="lg:col-span-5 bg-surface-container p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative z-20">
      <div>
        <div className="mb-8">
          <h2 className="font-headline-md text-headline-md text-on-surface font-semibold" id="auth-title">
            Iniciar sesión
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant" id="auth-subtitle">
            Acceso con una cuenta verificada de Google o GitHub
          </p>
        </div>

        <label htmlFor="accept-terms" className="mb-5 flex items-start gap-3 text-sm text-on-surface-variant">
          <input
            id="accept-terms"
            type="checkbox"
            required
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <span>
            He leído y acepto los{' '}
            <button
              type="button"
              onClick={() => setIsTermsOpen(true)}
              className="text-primary hover:underline focus:outline-none font-semibold"
            >
              Términos y Condiciones
            </button>
          </span>
        </label>

        <div className="space-y-3">
          {['google', 'github'].map((provider) => (
            <button
              key={provider}
              type="button"
              onClick={() => handleOAuth(provider)}
              disabled={!acceptedTerms || Boolean(loadingProvider)}
              className="w-full h-12 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high text-on-surface font-body-md text-body-md font-semibold transition flex items-center justify-center gap-3 disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-lg">
                {provider === 'google' ? 'account_circle' : 'code'}
              </span>
              {loadingProvider === provider ? 'Conectando...' : `Continuar con ${provider === 'google' ? 'Google' : 'GitHub'}`}
            </button>
          ))}
        </div>

        <p className="mt-6 text-center font-label-sm text-label-sm text-on-surface-variant">
          Se aceptan cuentas de correo estándar verificadas por el proveedor.
        </p>
      </div>

      <div className="pt-8 text-center">
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          La aceptación queda registrada en tu sesión.
        </p>
      </div>

      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </div>
  );
};
