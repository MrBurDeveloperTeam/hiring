import { ButtonHTMLAttributes, ReactElement, ReactNode, cloneElement, isValidElement } from 'react';
import { cn } from '../../lib/utils';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg' | 'xl' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
  asChild?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  icon,
  rightIcon,
  loading,
  disabled,
  asChild,
  ...props
}: ButtonProps) {
  const variantClasses: Record<Variant, string> = {
    primary:
      'bg-gradient-to-r from-brand to-brand-hover text-white hover:shadow-md hover:-translate-y-0.5',
    secondary:
      'bg-white text-brand border border-brand/20 hover:border-brand/40 hover:shadow-md hover:-translate-y-0.5',
    outline:
      'border border-gray-200 text-gray-800 bg-white hover:border-brand hover:text-brand hover:shadow-md hover:-translate-y-0.5',
    ghost: 'text-gray-700 hover:bg-gray-100',
    destructive: 'bg-red-600 text-white hover:bg-red-700 hover:shadow-md hover:-translate-y-0.5'
  };

  const sizeClasses: Record<Size, string> = {
    sm: 'text-sm px-4 py-2.5',
    md: 'text-sm px-5 py-3',
    lg: 'text-base px-6 py-3.5',
    xl: 'text-lg px-8 py-4',
    icon: 'h-10 w-10 p-2 flex items-center justify-center'
  };

  const classes = cn(
    'inline-flex items-center gap-2 rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm',
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  if (asChild && isValidElement(children)) {
    return cloneElement(children as ReactElement, {
      className: cn((children as ReactElement).props.className, classes),
      children: (
        <>
          {icon && <span className="text-lg">{icon}</span>}
          {loading && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          <span>{(children as ReactElement).props.children}</span>
          {rightIcon && <span className="text-lg">{rightIcon}</span>}
        </>
      )
    });
  }

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {icon && <span className="text-lg">{icon}</span>}
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      <span>{children}</span>
      {rightIcon && <span className="text-lg">{rightIcon}</span>}
    </button>
  );
}
