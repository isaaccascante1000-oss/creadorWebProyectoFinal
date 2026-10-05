import { useState } from 'react';
import { authService } from '../services/authService';
import TermsModal from './TermsModal';

export const AuthCard = ({ onShowToast, onEmailVerified }) => {
  const [loadingProvider, setLoadingProvider] = useState('');
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [emailAction, setEmailAction] = useState('');

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

  const handleRequestEmailCode = async (event) => {
    event.preventDefault();
    if (!acceptedTerms) {
      onShowToast?.('Acepta los Términos y Condiciones antes de continuar.', 'warning');
      return;
    }
    setEmailAction('request');
    const result = await authService.requestEmailCode(email.trim());
    setEmailAction('');
    if (!result.success) {
      onShowToast?.(result.error, 'error');
      return;
    }
    setCodeSent(true);
    onShowToast?.('Si el correo es válido, recibirás un código de verificación.', 'mark_email_read');
  };

  const handleVerifyEmailCode = async (event) => {
    event.preventDefault();
    setEmailAction('verify');
    const result = await authService.verifyEmailCode(email.trim(), verificationCode);
    setEmailAction('');
    if (!result.success) {
      onShowToast?.(result.error, 'error');
      return;
    }
    onShowToast?.('Correo verificado. Iniciando sesión...', 'verified_user');
    onEmailVerified?.();
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

        <div className="my-6 flex items-center gap-3 text-xs text-on-surface-variant" aria-hidden="true">
          <span className="h-px flex-1 bg-outline-variant/30" />
          <span>o con correo</span>
          <span className="h-px flex-1 bg-outline-variant/30" />
        </div>

        <form onSubmit={codeSent ? handleVerifyEmailCode : handleRequestEmailCode} className="space-y-3">
          <label htmlFor="auth-email" className="block text-sm font-medium text-on-surface-variant">
            Correo electrónico
          </label>
          <input
            id="auth-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nombre@ejemplo.com"
            disabled={Boolean(emailAction)}
            className="w-full h-12 rounded-lg bg-surface-container-lowest border border-outline-variant/30 px-4 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary disabled:opacity-60"
          />
          {codeSent && (
            <>
              <label htmlFor="verification-code" className="block text-sm font-medium text-on-surface-variant">
                Código de verificación
              </label>
              <input
                id="verification-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                disabled={Boolean(emailAction)}
                className="w-full h-12 rounded-lg bg-surface-container-lowest border border-outline-variant/30 px-4 text-center font-mono text-lg tracking-[0.35em] text-on-surface placeholder:text-outline focus:outline-none focus:border-primary disabled:opacity-60"
              />
            </>
          )}
          <button
            type="submit"
            disabled={!acceptedTerms || Boolean(emailAction)}
            className="w-full h-12 rounded-lg bg-primary text-on-primary font-semibold transition hover:brightness-105 disabled:opacity-60"
          >
            {emailAction === 'request' ? 'Enviando código...' : emailAction === 'verify' ? 'Verificando...' : codeSent ? 'Verificar código' : 'Continuar con correo'}
          </button>
          {codeSent && (
            <button
              type="button"
              onClick={handleRequestEmailCode}
              disabled={!acceptedTerms || Boolean(emailAction)}
              className="w-full py-2 text-sm font-semibold text-primary hover:underline disabled:opacity-60"
            >
              Reenviar código
            </button>
          )}
        </form>

        <p className="mt-6 text-center font-label-sm text-label-sm text-on-surface-variant">
          También puedes verificar tu cuenta mediante un código enviado por correo.
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
