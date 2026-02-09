import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface TabItem {
  id: string;
  label: string | ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex flex-wrap gap-2 rounded-xl border border-gray-100 bg-white p-2', className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition',
              isActive
                ? 'bg-brand text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
