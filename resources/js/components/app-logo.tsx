import logoUrl from '@/assets/logo_dark.png';
import { useTranslation } from '@/hooks/use-translation';

export default function AppLogo() {
    const { t } = useTranslation();

    return (
        <>
            <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-md">
                <img src={logoUrl} alt={t.common.appName} className="h-8 w-8 object-contain" />
            </div>
            <div className="ml-1 grid min-w-0 flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold" title={t.common.appName}>
                    {t.common.appName}
                </span>
                <span className="truncate text-[11px] font-medium tracking-wider text-sidebar-foreground/70 uppercase">{t.common.specTag}</span>
            </div>
        </>
    );
}
