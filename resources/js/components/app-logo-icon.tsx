import logoUrl from '@/assets/logo_dark.png';
import { type ImgHTMLAttributes } from 'react';

export default function AppLogoIcon({ className, alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src={logoUrl}
            alt={alt || 'Logo'}
            className={className || 'h-6 w-6 object-contain'}
            {...props}
        />
    );
}
