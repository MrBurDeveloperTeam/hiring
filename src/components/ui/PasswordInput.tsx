import { useState, InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  hint?: string;
}

export function PasswordInput({ className, label, hint, ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <label className="flex w-full flex-col gap-1 text-sm">
      {label && <span className="font-medium text-gray-800">{label}</span>}
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          className={cn(
            'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 shadow-sm transition focus:border-brand focus:ring-2 focus:ring-brand/20',
            className
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {hint && <span className="text-xs text-gray-500">{hint}</span>}
    </label>
  );
}
