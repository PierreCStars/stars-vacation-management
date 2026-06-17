import { normalizeCompanyCode, type CompanyCode } from '@/lib/company-colors';

export type AdminAccess = 'ALL' | 'READ_ONLY';

export interface AdminEntry {
  email: string;
  access: AdminAccess;
  /**
   * Périmètre de validation. Si absent → l'admin peut valider TOUTES les
   * entreprises. Si présent → il ne peut valider que les demandes de ces
   * entreprises. Sans effet pour les READ_ONLY (qui ne valident jamais).
   */
  companies?: CompanyCode[];
}

export const ADMINS: AdminEntry[] = [
  { email: 'pierre@stars.mc', access: 'ALL' },
  { email: 'johnny@stars.mc', access: 'ALL' }, // toutes les demandes
  // Daniel : uniquement Stars.mc, Le Pneu et Midi Pneu
  { email: 'daniel@stars.mc', access: 'ALL', companies: ['STARS_MC', 'LE_PNEU', 'MIDI_PNEU'] },
  { email: 'lorenzo@stars.mc', access: 'ALL' },
  { email: 'compta@stars.mc', access: 'READ_ONLY' },
];

function findAdmin(email?: string | null): AdminEntry | undefined {
  if (!email) return undefined;
  return ADMINS.find(a => a.email.toLowerCase() === email.toLowerCase());
}

// Utility
export function isAdmin(email?: string | null): boolean {
  return !!findAdmin(email);
}

export function isReadOnlyAdmin(email?: string | null): boolean {
  return findAdmin(email)?.access === 'READ_ONLY';
}

export function isFullAdmin(email?: string | null): boolean {
  return findAdmin(email)?.access === 'ALL';
}

/**
 * Cet admin peut-il valider/refuser une demande de l'entreprise donnée ?
 * Doit être un full admin ; respecte le périmètre `companies` s'il est défini.
 * `company` peut être un code (STARS_MC) ou un nom affiché — normalisé ici.
 */
export function canValidateCompany(email?: string | null, company?: string | null): boolean {
  const admin = findAdmin(email);
  if (!admin || admin.access !== 'ALL') return false;
  if (!admin.companies) return true; // périmètre global
  const code = normalizeCompanyCode(company);
  return !!code && admin.companies.includes(code);
}

/**
 * Liste des codes entreprises que l'admin peut valider, ou null s'il peut tout
 * valider (périmètre global). Tableau vide si l'admin ne valide rien.
 */
export function validatableCompanies(email?: string | null): CompanyCode[] | null {
  const admin = findAdmin(email);
  if (!admin || admin.access !== 'ALL') return [];
  return admin.companies ?? null;
}
