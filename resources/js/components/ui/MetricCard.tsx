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
  iconBgClass = 'bg-blue-50',
  iconColorClass = 'text-blue-900',
  caption,
  badgeText,
  badgeVariant = 'neutral',
}) => {
  const badgeClasses = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-300',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
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
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-xs font-sans font-semibold text-slate-600 uppercase tracking-wider">
          {title}
        </p>
        <div className={`p-2 rounded-md border border-slate-100 ${iconBgClass} ${iconColorClass}`}>
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
          className="text-slate-900"
        />
        {badgeText && (
          <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded border font-sans font-medium uppercase ${badgeClasses}`}>
            {badgeText}
          </span>
        )}
      </div>

      {caption && (
        <p className="mt-2 text-xs font-sans text-slate-500">
          {caption}
        </p>
      )}
    </div>
  );
};

export default MetricCard;
