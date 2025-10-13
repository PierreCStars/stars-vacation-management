/**
 * Vacation type localization utilities
 */

export type VacationType = 'PAID_VACATION' | 'PERSONAL_DAY' | 'RECUPERATION' | 'OTHER' | 'VACATION' | 'UNPAID_VACATION';

export type Locale = 'en' | 'fr' | 'it';

/**
 * Get localized vacation type label
 */
export function getVacationTypeLabel(type: string, locale: Locale = 'en'): string {
  const vacationTypeLabels = {
    en: {
      'PAID_VACATION': 'Paid Vacation',
      'VACATION': 'Paid Vacation',
      'PERSONAL_DAY': 'Personal Day',
      'RECUPERATION': 'Récupération',
      'OTHER': 'Other',
      'UNPAID_VACATION': 'Unpaid Vacation'
    },
    fr: {
      'PAID_VACATION': 'Congés payés',
      'VACATION': 'Congés payés',
      'PERSONAL_DAY': 'Jour personnel',
      'RECUPERATION': 'Récupération',
      'OTHER': 'Autre',
      'UNPAID_VACATION': 'Congé sans solde'
    },
    it: {
      'PAID_VACATION': 'Ferie pagate',
      'VACATION': 'Ferie pagate',
      'PERSONAL_DAY': 'Giorno personale',
      'RECUPERATION': 'Recupero',
      'OTHER': 'Altro',
      'UNPAID_VACATION': 'Permesso non retribuito'
    }
  };

  return vacationTypeLabels[locale]?.[type as VacationType] || type;
}

/**
 * Get vacation type label using next-intl translations
 * This function should be used in React components with access to useTranslations
 */
export function getVacationTypeLabelFromTranslations(type: string, tVacations: (key: string) => string): string {
  const typeMap: Record<string, string> = {
    'PAID_VACATION': 'paidVacation',
    'VACATION': 'paidVacation',
    'PERSONAL_DAY': 'personalDay',
    'RECUPERATION': 'recuperation',
    'OTHER': 'other',
    'UNPAID_VACATION': 'unpaidVacation'
  };

  const translationKey = typeMap[type];
  return translationKey ? tVacations(translationKey) : type;
}
