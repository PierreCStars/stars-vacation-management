// Use require for JSON files to avoid module resolution issues
const en = require('./en.json');
const fr = require('./fr.json');
const it = require('./it.json');

export const messages = { en, fr, it };
export type SupportedLocale = keyof typeof messages;
