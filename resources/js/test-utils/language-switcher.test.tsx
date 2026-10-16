import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TranslationProvider } from '@/hooks/use-translation';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

describe('LanguageSwitcher Component', () => {
  it('renders without any emoji symbols in segmented variant', () => {
    const { container } = render(
      <TranslationProvider>
        <LanguageSwitcher variant="segmented" />
      </TranslationProvider>
    );

    const emojiRegex = /[\uD83C-\uDBFF\uDC00-\uDFFF]/;
    expect(emojiRegex.test(container.textContent || '')).toBe(false);
    expect(screen.getByText('EN')).toBeDefined();
    expect(screen.getByText('ID')).toBeDefined();
  });

  it('renders compact variant with uppercase badge and toggles locale', async () => {
    const user = userEvent.setup();
    render(
      <TranslationProvider>
        <LanguageSwitcher variant="compact" />
      </TranslationProvider>
    );

    const btn = screen.getByRole('button');
    expect(btn.textContent).toContain('[en]');

    await user.click(btn);
    expect(btn.textContent).toContain('[id]');
  });
});
