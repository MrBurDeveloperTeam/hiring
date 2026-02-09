import { cn } from '../lib/utils';

interface TagPillProps {
  label: string;
  highlighted?: boolean;
  className?: string;
}

export function TagPill({ label, highlighted, className }: TagPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition',
        highlighted
          ? 'border-brand bg-brand/10 text-brand'
          : 'border-gray-200 bg-white text-gray-700',
        className
      )}
    >
      {label}
    </span>
  );
}
