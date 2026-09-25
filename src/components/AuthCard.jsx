import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { n8nService } from '../services/n8nService';
import { useAuth } from '../context/AuthContext';

export const AuthCard = ({ onShowToast }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [currentTab, setCurrentTab] = useState('login');
  const [activeRole, setActiveRole] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: 'admin@canvasai.fwd',
    password: '••••••••',
  });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await authService.login(formData.email, formData.password, activeRole);

    if (result.success) {
      // Guardar sesión en AuthContext global
      login(result.user);
    }

    // Si es una acción de registro, dispara el webhook N8N
    if (currentTab === 'register' && result.success) {
      await n8nService.sendUserRegistrationWebhook({
        email: formData.email,
        name: formData.fullName || result.user.name,
        role: result.user.role,
      });
    }

    setTimeout(() => {
      setLoading(false);
      if (onShowToast) {
        onShowToast(
          currentTab === 'register'
            ? `¡Registro exitoso! Notificado a N8N. Rol: ${result.user.role.toUpperCase()}`
            : `¡Bienvenido! Rol asignado: ${result.user.role.toUpperCase()} (${result.user.email})`,
          'verified_user'
        );
      }
      const targetRoute = result.user.role === 'admin' ? '/admin' : '/canvas';
      navigate(targetRoute);
    }, 600);
  };

  const triggerQuickAuth = async (provider) => {
    if (onShowToast) {
      onShowToast(`Conectando con credenciales seguras de ${provider}...`, 'cloud_sync');
    }
    const result = await authService.login(`${provider.toLowerCase()}@canvasai.fwd`, 'sso', activeRole);
    if (result.success) {
      login(result.user);
    }
    setTimeout(() => {
      const targetRoute = result.user.role === 'admin' ? '/admin' : '/canvas';
      navigate(targetRoute);
    }, 600);
  };

  return (
    <div className="lg:col-span-5 bg-surface-container p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative z-20">
      <div>
        {/* Top Tab Switcher */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold" id="auth-title">
              {currentTab === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant" id="auth-subtitle">
              {currentTab === 'login'
                ? 'Accede a tu estación de trabajo y lienzo de IA'
                : 'Únete a la plataforma de generación multimodal FWD'}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-xl">vpn_key</span>
          </div>
        </div>

        {/* Segmented Tab Button Control */}
        <div className="p-1 rounded-xl bg-surface-container-lowest flex items-center mb-6">
          <button
            type="button"
            onClick={() => setCurrentTab('login')}
            className={`w-1/2 py-2.5 rounded-lg font-body-sm text-body-sm font-semibold transition-all ${
              currentTab === 'login'
                ? 'bg-primary text-on-primary shadow'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('register')}
            className={`w-1/2 py-2.5 rounded-lg font-body-sm text-body-sm font-semibold transition-all ${
              currentTab === 'register'
                ? 'bg-primary text-on-primary shadow'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Crear Cuenta
          </button>
        </div>

        {/* Authentication Form Container */}
        <form className="space-y-4" onSubmit={handleAuthSubmit}>
          {/* Full Name (Registration Mode) */}
          {currentTab === 'register' && (
            <div className="flex flex-col space-y-1.5">
              <label className="font-label-md text-label-md text-on-surface-variant flex items-center justify-between">
                <span>Nombre Completo</span>
                <span className="font-label-sm text-label-sm text-outline">Requerido</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-outline text-lg">badge</span>
                <input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Isaac Andrés Cascante Linares"
                  className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md placeholder:text-outline-variant focus:outline-none focus:bg-surface-container-low shadow-inner transition"
                />
              </div>
            </div>
          )}

          {/* Email Input */}
          <div className="flex flex-col space-y-1.5">
            <label className="font-label-md text-label-md text-on-surface-variant flex items-center justify-between">
              <span>Correo Electrónico Institucional</span>
              <span className="font-label-sm text-label-sm text-tertiary">db.json auth</span>
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-outline text-lg">mail</span>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="usuario@canvasai.fwd"
                className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md placeholder:text-outline-variant focus:outline-none focus:bg-surface-container-low shadow-inner transition"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="flex flex-col space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-label-md text-label-md text-on-surface-variant">Contraseña</label>
              <a href="#" className="font-label-sm text-label-sm text-primary hover:underline">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-outline text-lg">lock</span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Mínimo 8 caracteres"
                className="w-full h-11 pl-10 pr-10 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md placeholder:text-outline-variant focus:outline-none focus:bg-surface-container-low shadow-inner transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-outline hover:text-on-surface flex items-center"
              >
                <span className="material-symbols-outlined text-lg">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Interactive Role Selector */}
          <div className="pt-2">
            <label className="font-label-md text-label-md text-on-surface-variant mb-2 block">
              Selecciona tu Rol de Acceso
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Option 1: Administrator */}
              <div
                onClick={() => setActiveRole('admin')}
                className={`cursor-pointer p-3 rounded-lg transition-all flex flex-col justify-between ${
                  activeRole === 'admin'
                    ? 'bg-surface-container-high shadow-sm opacity-100'
                    : 'bg-surface-container-lowest opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="material-symbols-outlined text-primary text-xl">admin_panel_settings</span>
                  {activeRole === 'admin' && (
                    <span className="w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-primary text-[10px] font-bold">check</span>
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <div className="font-label-md text-label-md font-semibold text-on-surface">Administrador</div>
                  <div className="font-label-sm text-[11px] text-outline">Gestión global y usuarios</div>
                </div>
              </div>

              {/* Option 2: Developer */}
              <div
                onClick={() => setActiveRole('dev')}
                className={`cursor-pointer p-3 rounded-lg transition-all flex flex-col justify-between ${
                  activeRole === 'dev'
                    ? 'bg-surface-container-high shadow-sm opacity-100'
                    : 'bg-surface-container-lowest opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="material-symbols-outlined text-tertiary text-xl">code_blocks</span>
                  {activeRole === 'dev' && (
                    <span className="w-3.5 h-3.5 rounded-full bg-tertiary flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-tertiary text-[10px] font-bold">check</span>
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <div className="font-label-md text-label-md font-semibold text-on-surface">Desarrollador</div>
                  <div className="font-label-sm text-[11px] text-outline">Lienzo y Prompts IA</div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-lg bg-primary hover:bg-primary-fixed-dim text-on-primary font-body-md text-body-md font-semibold transition-all shadow-lg flex items-center justify-center gap-2 group cursor-pointer"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
              )}
              <span>
                {loading
                  ? 'Autenticando en JSON Server...'
                  : currentTab === 'login'
                  ? 'Ingresar a CanvasAI'
                  : 'Comenzar en CanvasAI'}
              </span>
              <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="relative flex py-4 items-center">
          <div className="flex-grow bg-surface-variant h-px"></div>
          <span className="flex-shrink mx-4 font-label-sm text-label-sm text-outline uppercase tracking-wider">
            O continuar con
          </span>
          <div className="flex-grow bg-surface-variant h-px"></div>
        </div>

        {/* SSO Fast Authentication buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => triggerQuickAuth('GitHub')}
            className="h-10 px-3 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current text-on-surface" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            <span className="font-label-md text-label-md text-on-surface">GitHub</span>
          </button>

          <button
            type="button"
            onClick={() => triggerQuickAuth('Google')}
            className="h-10 px-3 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            <span className="font-label-md text-label-md text-on-surface">Google SSO</span>
          </button>
        </div>
      </div>

      {/* Footer Institutional Credentials */}
      <div className="pt-6 border-t border-surface-variant/40 flex flex-col sm:flex-row items-center justify-between text-outline gap-2">
        <span className="font-label-sm text-label-sm">FWD Academy • Frontend React</span>
        <span className="font-label-sm text-label-sm flex items-center gap-1">
          <span className="material-symbols-outlined text-xs text-tertiary">check_circle</span>
          WCAG 2.1 AA Compliant
        </span>
      </div>
    </div>
  );
};
