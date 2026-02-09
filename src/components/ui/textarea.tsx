import { TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export function Textarea({ className, label, hint, ...props }: TextareaProps) {
  return (
    <label className="flex w-full flex-col gap-1 text-sm">
      {label && <span className="font-medium text-gray-800">{label}</span>}
      <textarea
        className={cn(
          'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-brand focus:ring-2 focus:ring-brand/20',
          className
        )}
        {...props}
      />
      {hint && <span className="text-xs text-gray-500">{hint}</span>}
    </label>
  );
}
