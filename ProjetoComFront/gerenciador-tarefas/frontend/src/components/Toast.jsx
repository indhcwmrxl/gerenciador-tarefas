import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export function ToastContainer({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
          error: <XCircle className="w-5 h-5 text-rose-500 shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
          info: <Info className="w-5 h-5 text-primary-500 shrink-0" />,
        };

        const bgStyles = {
          success: 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800 text-slate-800 dark:text-slate-100',
          error: 'bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-800 text-slate-800 dark:text-slate-100',
          warning: 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-800 text-slate-800 dark:text-slate-100',
          info: 'bg-white dark:bg-slate-900 border-primary-300 dark:border-primary-800 text-slate-800 dark:text-slate-100',
        };

        const type = toast.type || 'info';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-xl transition-all duration-300 animate-slide-down ${bgStyles[type]}`}
          >
            {icons[type]}
            <div className="flex-1 text-xs font-medium leading-relaxed">
              {toast.title && <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px] mb-0.5">{toast.title}</div>}
              <div>{toast.message}</div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
