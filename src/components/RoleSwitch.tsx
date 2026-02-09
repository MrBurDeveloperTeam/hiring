import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export type Role = 'seeker' | 'employer' | 'admin';

interface RoleSwitchProps {
  value: Role;
  onChange: (role: Role) => void;
  className?: string;
}

const routes: Record<Role, string> = {
  seeker: '/seekers',
  employer: '/employers',
  admin: '/admin'
};

export function RoleSwitch({ value, onChange, className }: RoleSwitchProps) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) onChange('admin');
    if (location.pathname.startsWith('/employer')) onChange('employer');
    if (location.pathname.startsWith('/seekers')) onChange('seeker');
    if (location.pathname.startsWith('/jobs') || location.pathname.startsWith('/student')) {
      onChange('seeker');
    }
  }, [location.pathname, onChange]);

  return (
    <label className={cn('flex items-center gap-2 text-xs font-semibold text-gray-500', className)}>
      Role
      <select
        value={value}
        onChange={(e) => {
          const next = e.target.value as Role;
          onChange(next);
          navigate(routes[next]);
        }}
        className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm focus:border-brand focus:ring-2 focus:ring-brand/20"
      >
        <option value="seeker">Job Seeker</option>
        <option value="employer">Employer</option>
        <option value="admin">Admin</option>
      </select>
    </label>
  );
}
