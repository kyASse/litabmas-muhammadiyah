import React from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

export interface LanguageSwitcherProps {
  variant?: 'segmented' | 'compact';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'segmented',
  className = '',
}) => {
  const { locale, setLocale, toggleLocale } = useTranslation();

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={toggleLocale}
        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-blue-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-900/20 ${className}`}
        title="Switch Language (EN / ID)"
      >
        <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" strokeWidth={1.75} />
        <span className="uppercase font-bold">[{locale}]</span>
      </button>
    );
  }

  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-md border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800 text-xs font-mono ${className}`}
      role="group"
      aria-label="Language selector"
    >
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`px-2 py-0.5 rounded transition-all text-xs ${
          locale === 'en'
            ? 'bg-white text-blue-900 font-bold shadow-2xs dark:bg-slate-900 dark:text-blue-400'
            : 'text-slate-500 hover:text-slate-900 font-medium dark:text-slate-400 dark:hover:text-white'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale('id')}
        className={`px-2 py-0.5 rounded transition-all text-xs ${
          locale === 'id'
            ? 'bg-white text-blue-900 font-bold shadow-2xs dark:bg-slate-900 dark:text-blue-400'
            : 'text-slate-500 hover:text-slate-900 font-medium dark:text-slate-400 dark:hover:text-white'
        }`}
      >
        ID
      </button>
    </div>
  );
};

export default LanguageSwitcher;
