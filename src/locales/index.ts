// Dynamic import function for JSON files to work with Next.js 15
export async function loadMessages() {
  const en = await import('./en.json');
  const fr = await import('./fr.json');
  const it = await import('./it.json');
  
  return { 
    en: en.default, 
    fr: fr.default, 
    it: it.default 
  };
}

// For backward compatibility, we'll also try to load them synchronously
let messages: any = {};

try {
  // Try to load synchronously first
  const en = require('./en.json');
  const fr = require('./fr.json');
  const it = require('./it.json');
  messages = { en, fr, it };
} catch (error) {
  console.warn('Could not load messages synchronously, will use dynamic loading');
}

export { messages };
export type SupportedLocale = 'en' | 'fr' | 'it';
