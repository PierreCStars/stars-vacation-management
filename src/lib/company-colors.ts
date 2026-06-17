// Centralized company color configuration
// This ensures all calendar components use the same colors

export const COMPANY_COLORS = {
  'STARS_MC': {
    id: '1',
    name: 'Stars MC',
    displayName: 'Stars MC',
    hex: '#3b82f6',        // Blue
    googleColorId: '1'     // Google Calendar color ID
  },
  'STARS_YACHTING': {
    id: '2',
    name: 'Stars Yachting',
    displayName: 'Stars Yachting',
    hex: '#10b981',        // Green
    googleColorId: '2'     // Google Calendar color ID
  },
  'STARS_REAL_ESTATE': {
    id: '3',
    name: 'Stars Real Estate',
    displayName: 'Stars Real Estate',
    hex: '#ef4444',        // Red
    googleColorId: '3'     // Google Calendar color ID
  },
  'LE_PNEU': {
    id: '4',
    name: 'Le Pneu',
    displayName: 'Le Pneu',
    hex: '#f59e0b',        // Orange
    googleColorId: '4'     // Google Calendar color ID
  },
  'MIDI_PNEU': {
    id: '5',
    name: 'Midi Pneu',
    displayName: 'Midi Pneu',
    hex: '#8b5cf6',        // Purple
    googleColorId: '5'     // Google Calendar color ID
  },
  'STARS_AVIATION': {
    id: '6',
    name: 'Stars Aviation',
    displayName: 'Stars Aviation',
    hex: '#ec4899',        // Pink
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
