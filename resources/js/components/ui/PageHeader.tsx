import React from 'react';
import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  isEditorialSerif?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  isEditorialSerif = false,
  breadcrumbs = [],
  subtitle,
  badge,
  actions,
}) => {
  return (
    <div className="mb-6 pb-5 border-b border-slate-200">
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-1.5 text-xs text-slate-500 mb-2 font-sans">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-blue-900 transition-colors truncate max-w-xs"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-800 font-medium truncate max-w-sm">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <h1
              className={`text-slate-900 tracking-tight ${
                isEditorialSerif
                  ? 'font-serif text-2xl sm:text-3xl font-semibold'
                  : 'font-sans text-xl sm:text-2xl font-bold'
              }`}
            >
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && (
            <p className="text-sm text-slate-600 font-sans max-w-3xl">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center space-x-2.5 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
