// Centralized company color configuration.
// Couleurs OFFICIELLES de la charte Star Luxury Group (couleur signature de
// chaque filiale). Source : star-luxury-group-brand / references/<filiale>.md.
// Ne pas remplacer par des couleurs génériques.
export const COMPANY_COLORS = {
  'STARS_MC': {
    id: '1',
    name: 'Stars MC',
    displayName: 'Stars MC',
    hex: '#D8B11B',        // Doré SLG (couleur de marque Stars.mc)
    googleColorId: '1'     // Google Calendar color ID
  },
  'STARS_YACHTING': {
    id: '2',
    name: 'Stars Yachting',
    displayName: 'Stars Yachting',
    hex: '#21254B',        // Bleu nuit (signature Yachting)
    googleColorId: '2'     // Google Calendar color ID
  },
  'STARS_REAL_ESTATE': {
    id: '3',
    name: 'Stars Real Estate',
    displayName: 'Stars Real Estate',
    hex: '#273341',        // Ardoise (signature Real Estate)
    googleColorId: '3'     // Google Calendar color ID
  },
  'LE_PNEU': {
    id: '4',
    name: 'Le Pneu',
    displayName: 'Le Pneu',
    hex: '#EDF01A',        // Jaune signaling (signature Le Pneu)
    googleColorId: '4'     // Google Calendar color ID
  },
  'MIDI_PNEU': {
    id: '5',
    name: 'Midi Pneu',
    displayName: 'Midi Pneu',
    hex: '#EDF01A',        // Identité 100% partagée avec Le Pneu
    googleColorId: '5'     // Google Calendar color ID
  },
  'STARS_AVIATION': {
    id: '6',
    name: 'Stars Aviation',
    displayName: 'Stars Aviation',
    hex: '#0B77BD',        // Bleu ciel (signature Aviation)
    googleColorId: '6'     // Google Calendar color ID
  }
} as const;

// Helper function to get company color by company code
export function getCompanyColor(companyCode: string) {
  return COMPANY_COLORS[companyCode as keyof typeof COMPANY_COLORS] || COMPANY_COLORS.STARS_MC;
}

// Helper function to get all company colors for legends
export function getAllCompanyColors() {
  return Object.values(COMPANY_COLORS);
}

// Helper function to get Google Calendar color ID
export function getGoogleCalendarColorId(companyCode: string): string {
  return getCompanyColor(companyCode).googleColorId;
}

// Helper function to get hex color
export function getCompanyHexColor(companyCode: string): string {
  return getCompanyColor(companyCode).hex;
}

// Type for company codes
export type CompanyCode = keyof typeof COMPANY_COLORS;

/**
 * Renvoie une couleur de texte lisible (#0A0A0A ink ou #FFFFFF) sur un fond hex
 * donné, via la luminance relative. Indispensable car certaines couleurs de
 * filiale sont claires (jaune Le Pneu #EDF01A, doré Stars.mc #D8B11B) → texte
 * foncé, alors que bleu nuit / ardoise → texte blanc.
 */
export function readableTextColor(hex: string): '#0A0A0A' | '#FFFFFF' {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim());
  if (!m) return '#FFFFFF';
  const int = parseInt(m[1], 16);
  const r = (int >> 16) & 255, g = (int >> 8) & 255, b = int & 255;
  // Luminance perçue (sRGB approx.)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#0A0A0A' : '#FFFFFF';
}

/**
 * Normalise une valeur `company` libre (code ou nom affiché, casse/espaces/points
 * variables) vers un code d'entreprise connu. Renvoie `null` si aucune
 * correspondance (ex. "Unknown") — l'appelant garde alors une couleur neutre.
 * Ex : "stars.mc" → "STARS_MC", "Stars Real Estate" → "STARS_REAL_ESTATE".
 */
export function normalizeCompanyCode(input?: string | null): CompanyCode | null {
  const norm = (s?: string | null) => (s || '').toString().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const target = norm(input);
  if (!target) return null;
  for (const [code, c] of Object.entries(COMPANY_COLORS)) {
    if (target === norm(code) || target === norm(c.name) || target === norm(c.displayName)) {
      return code as CompanyCode;
    }
  }
  return null;
}
