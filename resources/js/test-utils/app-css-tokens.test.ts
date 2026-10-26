import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('CSS Theme Token Architecture', () => {
    it('declares dynamic CSS variables in @theme instead of static hex values', () => {
        const cssPath = path.resolve(process.cwd(), 'resources/css/app.css');
        const cssContent = fs.readFileSync(cssPath, 'utf-8');

        // Verify @theme delegates to var(--...)
        expect(cssContent).toContain('--color-surface-base: var(--surface-base);');
        expect(cssContent).toContain('--color-surface-card: var(--surface-card);');
        expect(cssContent).toContain('--color-text-primary: var(--text-primary);');
        expect(cssContent).toContain('--color-border-subtle: var(--border-subtle);');

        // Verify :root contains light tokens
        expect(cssContent).toContain('--surface-base: #f8fafc;');
        expect(cssContent).toContain('--surface-card: #ffffff;');

        // Verify .dark contains Deep Academic Midnight tokens
        expect(cssContent).toContain('--surface-base: #020617;');
        expect(cssContent).toContain('--surface-card: #0f172a;');
        expect(cssContent).toContain('--text-primary: #f8fafc;');
        expect(cssContent).toContain('--border-subtle: #1e293b;');
    });
});
