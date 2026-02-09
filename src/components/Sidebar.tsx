import { NavLink } from 'react-router-dom';
import { ReactNode } from 'react';
import { cn } from '../lib/utils';

export interface SidebarLink {
  label: string;
  to: string;
  icon?: ReactNode;
}

interface SidebarProps {
  title: string;
  links: SidebarLink[];
  orientation?: 'vertical' | 'horizontal';
}

export function Sidebar({ title, links, orientation = 'vertical' }: SidebarProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="px-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      <div
        className={cn(
          'mt-3 gap-1',
          orientation === 'horizontal' ? 'flex flex-wrap' : 'flex flex-col'
        )}
      >
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-brand/10 hover:text-brand',
                isActive ? 'bg-brand/10 text-brand' : 'text-gray-700'
              )
            }
          >
            {link.icon && <span className="text-lg text-brand">{link.icon}</span>}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
