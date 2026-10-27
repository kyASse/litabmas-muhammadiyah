import React from 'react';
import { LucideIcon } from 'lucide-react';
import { TabularFigure } from './TabularFigure';

export interface MetricCardProps {
  title: string;
  value: number | string;
  type?: 'currency' | 'score' | 'percentage' | 'integer';
  icon: LucideIcon | React.ReactNode;
  iconBgClass?: string;
  iconColorClass?: string;
  caption?: string;
  badgeText?: string;
  badgeVariant?: 'neutral' | 'success' | 'warning' | 'danger';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  type = 'integer',
  icon,
  iconBgClass = 'bg-blue-50 dark:bg-blue-950/40',
  iconColorClass = 'text-blue-900 dark:text-blue-400',
  caption,
  badgeText,
  badgeVariant = 'neutral',
}) => {
  const badgeClasses = {
    neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    success: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
    warning: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
    danger: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
  }[badgeVariant];

  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      return icon;
    }
    if (typeof icon === 'function' || typeof icon === 'object') {
      const IconComponent = icon as LucideIcon;
      return <IconComponent className="w-5 h-5" strokeWidth={1.75} />;
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-xs font-sans font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </p>
        <div className={`p-2 rounded-md border border-slate-100 dark:border-slate-800 ${iconBgClass} ${iconColorClass}`}>
          {renderIcon()}
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <TabularFigure
          value={value}
          type={type}
          size="2xl"
          weight="bold"
          align="left"
          className="text-slate-900 dark:text-slate-100"
        />
        {badgeText && (
          <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded border font-sans font-medium uppercase ${badgeClasses}`}>
            {badgeText}
          </span>
        )}
      </div>

      {caption && (
        <p className="mt-2 text-xs font-sans text-slate-500 dark:text-slate-400">
          {caption}
        </p>
      )}
    </div>
  );
};

export default MetricCard;
