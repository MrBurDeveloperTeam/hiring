import { ReactNode } from 'react';
import { cn } from '../lib/utils';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center', className)}>
      {icon && <div className="text-brand">{icon}</div>}
      <p className="text-lg font-semibold text-gray-900">{title}</p>
      <p className="text-sm text-gray-600 max-w-md">{description}</p>
      {action}
    </div>
  );
}
