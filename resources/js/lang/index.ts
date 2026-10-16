import { en, TranslationType } from './en';
import { id } from './id';

export type SupportedLocale = 'en' | 'id';

export const dictionaries: Record<SupportedLocale, TranslationType> = {
  en,
  id,
};

export { en, id };
export type { TranslationType };
