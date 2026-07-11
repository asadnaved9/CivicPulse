import { en } from './en';
import { hi } from './hi';
import { bn } from './bn';

export const translations = {
  en,
  hi,
  bn
};

export type LanguageCode = keyof typeof translations;
export type TranslationKey = keyof typeof en;
