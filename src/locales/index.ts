import en from './en.json';
import fr from './fr.json';
import it from './it.json';

export const messages = { en, fr, it };
export type SupportedLocale = keyof typeof messages;
