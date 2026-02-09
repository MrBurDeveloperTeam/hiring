import { ReactNode, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-2xl' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [open]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className={cn('mt-10 w-full rounded-2xl bg-white shadow-2xl', maxWidth)}>
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
