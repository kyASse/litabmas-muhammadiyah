import React from 'react';
import { useTranslation } from '@/hooks/use-translation';

export interface TabularFigureProps {
  value: number | string | null | undefined;
  type?: 'currency' | 'score' | 'percentage' | 'integer';
  decimals?: number;
  prefix?: string;
  suffix?: string;
  size?: 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'right' | 'center';
  className?: string;
}

export const TabularFigure: React.FC<TabularFigureProps> = ({
  value,
  type = 'currency',
  decimals,
  prefix,
  suffix,
  size = 'base',
  weight = 'medium',
  align = 'right',
  className = '',
}) => {
  const { locale } = useTranslation();
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  let formatted = '-';
  if (numValue !== null && numValue !== undefined && !isNaN(numValue)) {
    if (type === 'currency') {
      const isEn = locale === 'en';
      const numberFormatted = new Intl.NumberFormat(isEn ? 'en-US' : 'id-ID', {
        minimumFractionDigits: decimals ?? 0,
        maximumFractionDigits: decimals ?? 0,
      }).format(numValue);
      formatted = `${isEn ? 'IDR ' : 'Rp '}${numberFormatted}`;
    } else if (type === 'percentage') {
      formatted = `${numValue.toFixed(decimals ?? 1)}%`;
    } else if (type === 'score') {
      formatted = numValue.toFixed(decimals ?? 2);
    } else {
      formatted = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'id-ID', {
        minimumFractionDigits: decimals ?? 0,
        maximumFractionDigits: decimals ?? 0,
      }).format(numValue);
    }
  }

  const sizeClasses = {
    sm: 'text-xs',
    base: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
    '2xl': 'text-2xl',
  }[size];

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  }[weight];

  const alignClasses = {
    left: 'text-left',
    right: 'text-right',
    center: 'text-center',
  }[align];

  return (
    <span
      className={`font-mono tabular-nums tracking-tight text-slate-900 ${sizeClasses} ${weightClasses} ${alignClasses} ${className}`}
    >
      {prefix && <span className="text-slate-500 mr-0.5">{prefix}</span>}
      {formatted}
      {suffix && <span className="text-slate-500 ml-0.5">{suffix}</span>}
    </span>
  );
};

export default TabularFigure;
