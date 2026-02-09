import { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  icon?: ReactNode;
  containerClassName?: string;
}

export function Input({ className, label, hint, icon, containerClassName, ...props }: InputProps) {
  return (
    <label className={cn("flex w-full flex-col gap-1 text-sm", containerClassName)}>
      {label && <span className="font-medium text-gray-800">{label}</span>}
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          className={cn(
            'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-brand focus:ring-2 focus:ring-brand/20',
            icon && 'pl-10',
            className
          )}
          {...props}
        />
      </div>
      {hint && <span className="text-xs text-gray-500">{hint}</span>}
    </label>
  );
}
