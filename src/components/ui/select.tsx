import { SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  containerClassName?: string;
}

export function Select({ className, label, hint, children, containerClassName, ...props }: SelectProps) {
  return (
    <label className={cn("flex w-full flex-col gap-1 text-sm", containerClassName)}>
      {label && <span className="font-medium text-gray-800">{label}</span>}
      <select
        className={cn(
          'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-brand focus:ring-2 focus:ring-brand/20',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {hint && <span className="text-xs text-gray-500">{hint}</span>}
    </label>
  );
}
