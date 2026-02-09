import { Link } from 'react-router-dom';

interface Crumb {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: Crumb[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-500">
      {items.map((item, index) => (
        <span key={item.label} className="flex items-center gap-2">
          {item.to ? (
            <Link to={item.to} className="text-brand hover:text-brand-hover">
              {item.label}
            </Link>
          ) : (
            <span>{item.label}</span>
          )}
          {index < items.length - 1 && <span>/</span>}
        </span>
      ))}
    </nav>
  );
}
