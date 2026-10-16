import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    error: <AlertCircle className="w-4 h-4 text-rose-400" />,
    info: <Info className="w-4 h-4 text-purple-400" />,
  };

  return (
    <div className="fixed bottom-5 left-5 z-50 animate-slideUp flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl text-xs text-white max-w-sm">
      {icons[toast.type] || icons.info}
      <span className="flex-1 font-medium">{toast.message}</span>
      <button
        onClick={onClose}
        className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
