/**
 * Utilitaires de comptage des conflits de congés.
 *
 * Un conflit oppose DEUX demandes d'une même entreprise dont les périodes se
 * chevauchent. La détection (getRequestsWithConflicts) enrichit CHAQUE demande
 * avec ses conflits → une paire A↔B apparaît deux fois (une fois sur A, une
 * fois sur B). Pour l'alerte utilisateur, on compte les PAIRES UNIQUES.
 */

type ConflictLike = {
  conflictingRequests?: Array<{ id?: string }>;
};
type RequestLike = {
  id?: string;
  conflicts?: ConflictLike[];
};

/**
 * Compte les conflits d'un même JOUR : un conflit existe dès que ≥2 congés de
 * la MÊME entreprise tombent ce jour-là. Chaque entreprise concernée compte
 * pour 1 (deux personnes de sociétés différentes ne sont PAS en conflit).
 */
export function countCompanyConflicts(vacations: Array<{ company?: string | null }>): number {
  if (!Array.isArray(vacations)) return 0;
  const byCompany = new Map<string, number>();
  for (const v of vacations) {
    const key = (v?.company || 'UNKNOWN').trim().toUpperCase();
    byCompany.set(key, (byCompany.get(key) || 0) + 1);
  }
  return Array.from(byCompany.values()).filter(n => n >= 2).length;
}

/**
 * Compte le nombre de conflits UNIQUES (paires non ordonnées de demandes en
 * chevauchement). Une paire A↔B référencée des deux côtés ne compte qu'une fois.
 */
export function countUniqueConflicts(requests: RequestLike[]): number {
  if (!Array.isArray(requests)) return 0;
  const pairs = new Set<string>();
  for (const r of requests) {
    if (!r?.id || !Array.isArray(r.conflicts)) continue;
    for (const c of r.conflicts) {
      for (const cr of c?.conflictingRequests ?? []) {
        if (!cr?.id) continue;
        const key = [r.id, cr.id].sort().join('|');
        pairs.add(key);
      }
    }
  }
  return pairs.size;
}
