import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';
import { useTranslation } from '@/hooks/use-translation';

export interface ThemeToggleProps {
    variant?: 'compact' | 'icon';
    className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
    variant = 'compact',
    className = '',
}) => {
    const { appearance, updateAppearance } = useAppearance();
    const { t } = useTranslation();
    const [isDark, setIsDark] = useState<boolean>(() => {
        if (typeof document !== 'undefined') {
            return document.documentElement.classList.contains('dark');
        }
        return false;
    });

    useEffect(() => {
        const checkDark = () => {
            if (typeof document !== 'undefined') {
                setIsDark(document.documentElement.classList.contains('dark'));
            }
        };

        checkDark();

        if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
            const observer = new MutationObserver(() => {
                checkDark();
            });

            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['class'],
            });

            return () => observer.disconnect();
        }
    }, [appearance]);

    const handleToggle = () => {
        const nextTheme = isDark ? 'light' : 'dark';
        updateAppearance(nextTheme);
        setIsDark(!isDark);
    };

    const titleText = isDark ? t.theme.switchToLight : t.theme.switchToDark;
    const currentLabel = isDark ? t.theme.dark : t.theme.light;

    if (variant === 'icon') {
        return (
            <button
                type="button"
                onClick={handleToggle}
                className={`inline-flex items-center justify-center p-1.5 text-xs font-mono font-medium rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-blue-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-900/20 ${className}`}
                title={titleText}
                aria-label={titleText}
            >
                {isDark ? (
                    <Sun className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.75} />
                ) : (
                    <Moon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" strokeWidth={1.75} />
                )}
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={handleToggle}
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-blue-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-900/20 ${className}`}
            title={titleText}
            aria-label={titleText}
        >
            {isDark ? (
                <>
                    <Sun className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.75} />
                    <span className="hidden sm:inline uppercase font-bold">[{currentLabel}]</span>
                </>
            ) : (
                <>
                    <Moon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" strokeWidth={1.75} />
                    <span className="hidden sm:inline uppercase font-bold">[{currentLabel}]</span>
                </>
            )}
        </button>
    );
};

export default ThemeToggle;
