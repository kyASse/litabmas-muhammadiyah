import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('CSS Theme Token Architecture', () => {
    it('declares dynamic CSS variables in @theme instead of static hex values', () => {
        const cssPath = path.resolve(process.cwd(), 'resources/css/app.css');
        const cssContent = fs.readFileSync(cssPath, 'utf-8');

        // Verify all 18 semantic tokens delegate to var(--...) in @theme
        const semanticTokens = [
            'surface-base', 'surface-card', 'surface-elevated', 'surface-muted', 'surface-sidebar',
            'border-subtle', 'border-strong', 'border-focus',
            'text-primary', 'text-secondary', 'text-muted', 'text-inverse',
            'brand-primary', 'brand-primary-hover', 'brand-primary-light',
            'brand-accent', 'brand-accent-hover', 'brand-accent-light',
        ];
        semanticTokens.forEach((token) => {
            expect(cssContent).toContain(`--color-${token}: var(--${token});`);
        });

        // Verify :root contains light Cool Slate tokens
        expect(cssContent).toContain('--surface-base: #f8fafc;');
        expect(cssContent).toContain('--surface-card: #ffffff;');
        expect(cssContent).toContain('--text-primary: #0f172a;');
        expect(cssContent).toContain('--border-subtle: #e2e8f0;');

        // Verify .dark contains Deep Academic Midnight tokens
        expect(cssContent).toContain('--surface-base: #020617;');
        expect(cssContent).toContain('--surface-card: #0f172a;');
        expect(cssContent).toContain('--text-primary: #f8fafc;');
        expect(cssContent).toContain('--border-subtle: #1e293b;');
    });
});
