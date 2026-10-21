import logoUrl from '@/assets/logo_dark.png';
import { useTranslation } from '@/hooks/use-translation';

export default function AppLogo() {
    const { t } = useTranslation();

    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md">
                <img src={logoUrl} alt="Majelis Diktilitbang" className="h-8 w-8 object-contain" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">{t.common.appName}</span>
            </div>
        </>
    );
}
