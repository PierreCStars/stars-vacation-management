/**
 * Vacation Types - Canonical list with strong typing and i18n
 */

export enum VacationType {
  PAID_LEAVE = 'PAID_LEAVE',
  UNPAID_LEAVE = 'UNPAID_LEAVE', 
  FAMILY_EVENT_LEAVE = 'FAMILY_EVENT_LEAVE',
  OVERTIME_COMPENSATION = 'OVERTIME_COMPENSATION'
}

export interface VacationTypeConfig {
  id: VacationType;
  labels: {
    en: string;
    fr: string;
    it: string;
  };
  description: {
    en: string;
    fr: string;
    it: string;
  };
}

export const VACATION_TYPES: VacationTypeConfig[] = [
  {
    id: VacationType.PAID_LEAVE,
    labels: {
      en: 'Paid leave',
      fr: 'Congés payés',
      it: 'Congedi retribuiti'
    },
    description: {
      en: 'Standard paid vacation leave',
      fr: 'Congés payés standard',
      it: 'Congedi retribuiti standard'
    }
  },
  {
    id: VacationType.UNPAID_LEAVE,
    labels: {
      en: 'Unpaid leave',
      fr: 'Congés sans solde',
      it: 'Congedi non retribuiti'
    },
    description: {
      en: 'Leave without pay',
      fr: 'Congés sans rémunération',
      it: 'Congedi senza retribuzione'
    }
  },
  {
    id: VacationType.FAMILY_EVENT_LEAVE,
    labels: {
      en: 'Family event leave (marriage or bereavement — specify in notes)',
      fr: 'Congés pour événements familiaux (mariage ou décès — à préciser dans les observations)',
      it: 'Congedo per eventi familiari (matrimonio o lutto — specificare nelle note)'
    },
    description: {
      en: 'Special leave for family events like marriage or bereavement',
      fr: 'Congés spéciaux pour événements familiaux comme mariage ou décès',
      it: 'Congedi speciali per eventi familiari come matrimonio o lutto'
    }
  },
  {
    id: VacationType.OVERTIME_COMPENSATION,
    labels: {
      en: 'Overtime compensation (time off)',
      fr: 'Récupération d\'heures supplémentaires',
      it: 'Recupero ore straordinarie'
    },
    description: {
      en: 'Time off in compensation for overtime worked',
      fr: 'Récupération des heures supplémentaires travaillées',
      it: 'Recupero delle ore straordinarie lavorate'
    }
  }
];

/**
 * Get vacation type label by locale
 */
export function getVacationTypeLabel(type: VacationType, locale: 'en' | 'fr' | 'it'): string {
  const config = VACATION_TYPES.find(t => t.id === type);
  return config?.labels[locale] || type;
}

/**
 * Get vacation type description by locale
 */
export function getVacationTypeDescription(type: VacationType, locale: 'en' | 'fr' | 'it'): string {
  const config = VACATION_TYPES.find(t => t.id === type);
  return config?.description[locale] || '';
}

/**
 * Get all vacation types for a locale
 */
export function getVacationTypesForLocale(locale: 'en' | 'fr' | 'it'): Array<{id: VacationType, label: string, description: string}> {
  return VACATION_TYPES.map(type => ({
    id: type.id,
    label: type.labels[locale],
    description: type.description[locale]
  }));
}

/**
 * Validate vacation type
 */
export function isValidVacationType(type: string): type is VacationType {
  return Object.values(VacationType).includes(type as VacationType);
}

/**
 * Get vacation type label from translations (for use with next-intl)
 */
export function getVacationTypeLabelFromTranslations(type: string, tVacations: any): string {
  switch (type) {
    case 'PAID_LEAVE':
      return tVacations('paidLeave');
    case 'UNPAID_LEAVE':
      return tVacations('unpaidLeave');
    case 'FAMILY_EVENT_LEAVE':
      return tVacations('familyEventLeave');
    case 'OVERTIME_COMPENSATION':
      return tVacations('overtimeCompensation');
    // Legacy mapping for existing data
    case 'PAID_VACATION':
      return tVacations('paidLeave');
    case 'UNPAID_VACATION':
      return tVacations('unpaidLeave');
    case 'PERSONAL_DAY':
      return tVacations('familyEventLeave');
    case 'RECUPERATION':
      return tVacations('overtimeCompensation');
    case 'OTHER':
      return tVacations('unpaidLeave');
    default:
      return type;
  }
}

/**
 * Get vacation type from string (with fallback)
 */
export function parseVacationType(type: string): VacationType {
  if (isValidVacationType(type)) {
    return type;
  }
  
  // Legacy mapping for existing data
  const legacyMapping: Record<string, VacationType> = {
    'PAID_VACATION': VacationType.PAID_LEAVE,
    'UNPAID_VACATION': VacationType.UNPAID_LEAVE,
    'PERSONAL_DAY': VacationType.FAMILY_EVENT_LEAVE,
    'RECUPERATION': VacationType.OVERTIME_COMPENSATION,
    'OTHER': VacationType.UNPAID_LEAVE
  };
  
  return legacyMapping[type] || VacationType.PAID_LEAVE;
}