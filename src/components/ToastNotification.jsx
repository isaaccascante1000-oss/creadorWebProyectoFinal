import React from 'react';

export const ToastNotification = ({ show, message, icon = 'task_alt' }) => {
  return (
    <div
      className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg bg-surface-container-highest shadow-2xl flex items-center gap-3 transition-all duration-300 transform z-50 ${
        show
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-24 opacity-0 pointer-events-none'
      }`}
      id="feedback-toast"
    >
      <span className="material-symbols-outlined text-tertiary" id="toast-icon">
        {icon}
      </span>
      <span className="font-body-sm text-body-sm text-on-surface" id="toast-msg">
        {message}
      </span>
    </div>
  );
};
