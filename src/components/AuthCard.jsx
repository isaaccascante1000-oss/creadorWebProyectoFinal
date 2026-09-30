import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { n8nService } from '../services/n8nService';
import { useAuth } from '../context/AuthContext';
import TermsModal from './TermsModal';

export const AuthCard = ({ onShowToast }) => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Estados principales
  const [currentTab, setCurrentTab] = useState('login'); // 'login' | 'register'
  const [registerStep, setRegisterStep] = useState('form'); // 'form' | 'verify'
  const [activeRole, setActiveRole] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  // Formulario de datos
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    verificationCode: '',
  });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setErrorMessage(''); // Limpiar errores al escribir
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleTabChange = (tab) => {
    setCurrentTab(tab);
    setRegisterStep('form');
    setErrorMessage('');
  };

  // Enviar formulario (Login o Solicitar Registro)
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      if (currentTab === 'login') {
        // --- FLUJO DE INICIO DE SESIÓN ---
        const result = await n8nService.login(formData.email, formData.password, activeRole);
        
        if (!result.success) {
          setErrorMessage(result.error || 'Correo o contraseña incorrectos.');
          onShowToast?.(result.error || 'Credenciales inválidas.', 'error');
          return;
        }

        login(result.user);
        onShowToast?.(`¡Bienvenido! Rol: ${result.user.role.toUpperCase()}`, 'verified_user');
        navigate(result.user.role === 'admin' ? '/admin' : '/canvas');

      } else if (currentTab === 'register' && registerStep === 'form') {
        // --- FLUJO DE REGISTRO PASO 1: ENVIAR CÓDIGO VIA N8N ---
        if (!formData.fullName.trim()) {
          setErrorMessage('Por favor ingresa tu nombre completo.');
          return;
        }

        const result = await n8nService.requestRegistration({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: activeRole,
        });

        if (!result.success) {
          setErrorMessage(result.error || 'No se pudo procesar el registro.');
          onShowToast?.(result.error || 'Error al registrar.', 'error');
          return;
        }

        // Avanzar al paso de verificación
        setRegisterStep('verify');
        onShowToast?.('Código de verificación enviado a tu correo.', 'mail');

      } else if (currentTab === 'register' && registerStep === 'verify') {
        // --- FLUJO DE REGISTRO PASO 2: VERIFICAR CÓDIGO OTP ---
        if (!formData.verificationCode || formData.verificationCode.length < 4) {
          setErrorMessage('Ingresa un código de verificación válido.');
          return;
        }

        const result = await n8nService.verifyCode(formData.email, formData.verificationCode);

        if (!result.success) {
          setErrorMessage(result.error || 'Código incorrecto o expirado.');
          onShowToast?.('Código inválido.', 'error');
          return;
        }

        login(result.user);
        onShowToast?.(`¡Registro y verificación exitosos! Rol: ${result.user.role.toUpperCase()}`, 'verified_user');
        navigate(result.user.role === 'admin' ? '/admin' : '/canvas');
      }
    } catch {
      setErrorMessage('No se pudo establecer conexión con el servidor de autenticación.');
      onShowToast?.('Error de conexión.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg:col-span-5 bg-surface-container p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative z-20">
      <div>
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold" id="auth-title">
              {currentTab === 'login'
                ? 'Iniciar Sesión'
                : registerStep === 'verify'
                ? 'Verificación de Seguridad'
                : 'Crear Cuenta'}
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant" id="auth-subtitle">
              {currentTab === 'login'
                ? 'Accede a tu estación de trabajo y lienzo de IA'
                : registerStep === 'verify'
                ? `Ingresa el código enviado a ${formData.email}`
                : 'Únete a la plataforma de generación multimodal FWD'}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-xl">
              {registerStep === 'verify' ? 'mark_email_read' : 'vpn_key'}
            </span>
          </div>
        </div>

        {/* Pestañas de Login / Registro (ocultas en paso de verificación) */}
        {registerStep === 'form' && (
          <div className="p-1 rounded-xl bg-surface-container-lowest flex items-center mb-6">
            <button
              type="button"
              onClick={() => handleTabChange('login')}
              className={`w-1/2 py-2.5 rounded-lg font-body-sm text-body-sm font-bold transition-all cursor-pointer ${
                currentTab === 'login' ? 'bg-primary text-black shadow' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('register')}
              className={`w-1/2 py-2.5 rounded-lg font-body-sm text-body-sm font-bold transition-all cursor-pointer ${
                currentTab === 'register' ? 'bg-primary text-black shadow' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Crear Cuenta
            </button>
          </div>
        )}

        {/* Banner de Mensaje de Error */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400 text-sm">
            <span className="material-symbols-outlined text-lg">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Formulario */}
        <form className="space-y-4" onSubmit={handleAuthSubmit}>
          {/* PASO DE VERIFICACIÓN DE CÓDIGO OTP */}
          {currentTab === 'register' && registerStep === 'verify' ? (
            <div className="flex flex-col space-y-1.5">
              <label className="font-label-md text-label-md text-on-surface-variant">
                Código de Verificación (OTP)
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-outline text-lg">key</span>
                <input
                  id="verificationCode"
                  type="text"
                  maxLength={6}
                  required
                  value={formData.verificationCode}
                  onChange={handleInputChange}
                  placeholder="Ej: 123456"
                  className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md tracking-widest text-center font-mono placeholder:text-outline-variant focus:outline-none focus:bg-surface-container-low shadow-inner transition"
                />
              </div>
              <button
                type="button"
                onClick={() => setRegisterStep('form')}
                className="text-xs text-primary hover:underline text-left mt-1"
              >
                ← Volver a modificar datos
              </button>
            </div>
          ) : (
            <>
              {/* CAMPO: NOMBRE COMPLETO (Solo en Registro) */}
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
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Isaac Andrés Cascante Linares"
                      className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md placeholder:text-outline-variant focus:outline-none focus:bg-surface-container-low shadow-inner transition"
                    />
                  </div>
                </div>
              )}

              {/* CAMPO: CORREO ELECTRÓNICO */}
              <div className="flex flex-col space-y-1.5">
                <label className="font-label-md text-label-md text-on-surface-variant flex items-center justify-between">
                  <span>Correo Electrónico Institucional</span>
                  <span className="font-label-sm text-label-sm text-tertiary">n8n auth</span>
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

              {/* CAMPO: CONTRASEÑA */}
              <div className="flex flex-col space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-label-md text-label-md text-on-surface-variant">Contraseña</label>
                  {currentTab === 'login' && (
                    <a href="#" className="font-label-sm text-label-sm text-primary hover:underline">
                      ¿Olvidaste tu contraseña?
                    </a>
                  )}
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

              {/* SELECTOR DE ROL */}
              <div className="pt-2">
                <label className="font-label-md text-label-md text-on-surface-variant mb-2 block">
                  Selecciona tu Rol de Acceso
                </label>
                <div className="grid grid-cols-2 gap-3">
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
                          <span className="material-symbols-outlined text-black text-[10px] font-bold">check</span>
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">Administrador</div>
                      <div className="font-label-sm text-[11px] text-outline">Gestión global y usuarios</div>
                    </div>
                  </div>

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
                          <span className="material-symbols-outlined text-black text-[10px] font-bold">check</span>
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
            </>
          )}

          {/* Enlace de Términos */}
          <div className="pt-1 text-center">
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              Al continuar, aceptas nuestros{' '}
              <button
                type="button"
                onClick={() => setIsTermsOpen(true)}
                className="text-primary hover:underline focus:outline-none font-semibold cursor-pointer"
              >
                términos y condiciones
              </button>
            </p>
          </div>

          {/* Botón Principal */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-lg bg-primary hover:opacity-90 text-black font-body-md text-body-md font-bold transition-all shadow-lg flex items-center justify-center gap-2 group cursor-pointer"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
              )}
              <span>
                {loading
                  ? 'Procesando en n8n...'
                  : currentTab === 'login'
                  ? 'Ingresar a CanvasAI'
                  : registerStep === 'verify'
                  ? 'Verificar y Finalizar'
                  : 'Enviar Código de Verificación'}
              </span>
              <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Modal de Términos */}
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </div>
  );
};