import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { VisualStage } from '../components/VisualStage';
import { AuthCard } from '../components/AuthCard';
import { ToastNotification } from '../components/ToastNotification';
import { AccessibilityToolbar } from '../components/AccessibilityToolbar';
import { useAuth } from '../context/AuthContext';
import { getAuthenticatedHome } from '../utils/authNavigation';
import { authService } from '../services/authService';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, role, login, logout } = useAuth();

  const [toastState, setToastState] = useState({
    show: false,
    message: '',
    icon: 'task_alt',
  });
  const oauthCallbackPromise = useRef(null);

  useEffect(() => {
    const from = location.state?.from;
    if (from?.pathname) {
      sessionStorage.setItem('canvasai_auth_redirect', JSON.stringify({
        pathname: from.pathname,
        search: from.search || '',
        hash: from.hash || '',
      }));
    }
  }, [location.state]);

  const handleShowToast = (message, icon = 'task_alt') => {
    setToastState({ show: true, message, icon });
    setTimeout(() => {
      setToastState((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!isLoading && isAuthenticated && !params.has('code') && !params.has('error')) {
      navigate(getAuthenticatedHome(role), { replace: true });
    }
  }, [isAuthenticated, isLoading, role, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('code') && !params.has('error')) return undefined;

    let active = true;
    const completeOAuth = async () => {
      oauthCallbackPromise.current ||= authService.completeOAuthCallback();
      const result = await oauthCallbackPromise.current;
      if (!active) return;

      window.history.replaceState({}, document.title, window.location.pathname);
      if (result.success) {
        const sessionUser = await login();
        if (!sessionUser?.termsAcceptedAt) {
          await logout();
          handleShowToast('Debes aceptar los Términos y Condiciones para iniciar sesión.', 'warning');
          return;
        }
        handleShowToast('Autenticación completada. Redirigiendo...', 'verified_user');
        const savedRedirect = sessionStorage.getItem('canvasai_auth_redirect');
        sessionStorage.removeItem('canvasai_auth_redirect');
        let targetRoute = getAuthenticatedHome(sessionUser.role);
        if (savedRedirect) {
          try {
            const from = JSON.parse(savedRedirect);
            if (typeof from.pathname === 'string' && from.pathname.startsWith('/') && !from.pathname.startsWith('//')) {
              targetRoute = { pathname: from.pathname, search: from.search || '', hash: from.hash || '' };
            }
          } catch (error) {
            console.warn('No se pudo restaurar la ruta previa al inicio de sesión.', error);
          }
        }
        navigate(targetRoute, { replace: true });
      } else if (params.has('code') || params.has('error')) {
        handleShowToast(result.error, 'error');
      }
    };

    completeOAuth();
    return () => { active = false; };
  }, [login, logout, navigate]);

  return (
    <main className="w-full min-h-screen flex items-center justify-center bg-surface relative overflow-x-hidden">
      <Link to="/" className="fixed top-4 left-4 z-50 inline-flex items-center gap-1 rounded-lg bg-surface-container-highest/90 px-3 py-2 text-sm font-semibold text-on-surface shadow-lg backdrop-blur-md transition hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary" aria-label="Volver a la Landing Page">
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Volver al inicio
      </Link>
      {/* Floating Accessibility Control Toolbar */}
      <div className="fixed top-4 right-4 z-50">
        <AccessibilityToolbar />
      </div>

      <div className="flex flex-col w-full">
        {/* Interactive Viewport Wrapper */}
        <div className="w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[820px] rounded-xl overflow-hidden shadow-2xl bg-surface-container-lowest relative border border-outline-variant/20">
            {/* Ambient Studio Radial Aura (Decorative Backdrops) */}
            <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-32 left-1/3 w-80 h-80 rounded-full bg-secondary-container/20 blur-3xl pointer-events-none"></div>
            <div className="absolute top-1/2 -right-40 w-96 h-96 rounded-full bg-tertiary-container/15 blur-3xl pointer-events-none"></div>

            {/* Left Region: Visual Stage */}
            <VisualStage />

            {/* Right Region: Authentication Hub */}
            <AuthCard onShowToast={handleShowToast} />
          </div>
        </div>
      </div>

      {/* Interactive Toast Notification */}
      <ToastNotification
        show={toastState.show}
        message={toastState.message}
        icon={toastState.icon}
      />
    </main>
  );
};

export default LoginPage;
