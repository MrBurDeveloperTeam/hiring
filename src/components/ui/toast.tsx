import { ReactNode, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { CheckCircle2, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ToastProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  variant?: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
  action?: ReactNode;
}

export function Toast({
  open,
  onClose,
  title,
  description,
  variant = 'success',
  duration = 2500,
  action
}: ToastProps) {
  useEffect(() => {
    if (!open) return;
    // If there is an action (like Undo), we might want to keep it open longer or indefinitely until user interacts?
    // For now, let's keep the auto-close behavior, maybe extend duration if action is present?
    const effectiveDuration = action ? 5000 : duration;
    const timer = setTimeout(onClose, effectiveDuration);
    return () => clearTimeout(timer);
  }, [open, duration, onClose, action]);

  if (!open) return null;

  const colors: Record<typeof variant, string> = {
    success: 'bg-emerald-50 text-emerald-900 border border-emerald-100',
    info: 'bg-blue-50 text-blue-900 border border-blue-100',
    warning: 'bg-amber-50 text-amber-900 border border-amber-100',
    error: 'bg-red-50 text-red-900 border border-red-100'
  };

  return ReactDOM.createPortal(
    <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-end px-4 py-6">
      <div
        className={cn(
          'pointer-events-auto flex min-w-[260px] max-w-sm items-start gap-3 rounded-2xl p-4 shadow-lg',
          colors[variant]
        )}
      >
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold">{title}</p>
          {description && <p className="text-sm text-gray-700">{description}</p>}
        </div>
        {action && (
          <div className="mt-0.5 shrink-0">
            {action}
          </div>
        )}
        <button
          onClick={onClose}
          className="rounded-full p-1 text-gray-500 transition hover:bg-white/60"
          aria-label="Close toast"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>,
    document.body
  );
}
