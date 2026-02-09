import { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  textClassName?: string;
}

export function Checkbox({ label, description, className, textClassName, ...props }: CheckboxProps) {
  return (
    <label className={cn('flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3', className)}>
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
        {...props}
      />
      <div className={cn("text-sm", textClassName)}>
        <p className="font-medium text-gray-800">{label}</p>
        {description && <p className="text-gray-500">{description}</p>}
      </div>
    </label>
  );
}
