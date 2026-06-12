/**
 * Monaco Public Holidays Provider
 * Provides typed events for Monaco holidays 2025-2027.
 * All dates are UTC-safe with Monday week start.
 *
 * SOURCE OFFICIELLE : https://monservicepublic.gouv.mc/agenda/jours-feries
 * Règle d'alignement (décision 2026-06-12) : on pointe UNIQUEMENT les jours
 * indiqués par cette page — pas de report au lundi si le férié tombe un
 * dimanche (le site affiche p.ex. Toussaint le 01/11/2026, un dimanche).
 * Le site est un agenda glissant (prochains fériés seulement) : vérifier
 * les dates de l'année suivante quand elles y apparaissent, et ajouter le
 * tableau de la nouvelle année chaque année.
 */

export interface MonacoHoliday {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD format
  isAllDay: boolean;
  description?: string;
}

export const MONACO_HOLIDAYS_2025: MonacoHoliday[] = [
  {
    id: 'monaco-2025-01-01',
    title: 'Jour de l\'an',
    date: '2025-01-01',
    isAllDay: true,
    description: 'New Year\'s Day'
  },
  {
    id: 'monaco-2025-01-27',
    title: 'Ste Dévote',
    date: '2025-01-27',
    isAllDay: true,
    description: 'Saint Devote Day'
  },
  {
    id: 'monaco-2025-04-21',
    title: 'Lundi de Pâques',
    date: '2025-04-21',
    isAllDay: true,
    description: 'Easter Monday'
  },
  {
    id: 'monaco-2025-05-01',
    title: 'Fête du Travail',
    date: '2025-05-01',
    isAllDay: true,
    description: 'Labour Day'
  },
  {
    id: 'monaco-2025-05-29',
    title: 'Ascension',
    date: '2025-05-29',
    isAllDay: true,
    description: 'Ascension Day'
  },
  {
    id: 'monaco-2025-06-09',
    title: 'Lundi de Pentecôte',
    date: '2025-06-09',
    isAllDay: true,
    description: 'Whit Monday'
  },
  {
    id: 'monaco-2025-06-19',
    title: 'Fête-Dieu',
    date: '2025-06-19',
    isAllDay: true,
    description: 'Corpus Christi'
  },
  {
    id: 'monaco-2025-08-15',
    title: 'Assomption',
    date: '2025-08-15',
    isAllDay: true,
    description: 'Assumption Day'
  },
  {
    id: 'monaco-2025-11-01',
    title: 'Toussaint',
    date: '2025-11-01',
    isAllDay: true,
    description: 'All Saints\' Day'
  },
  {
    id: 'monaco-2025-11-19',
    title: 'Fête du Prince',
    date: '2025-11-19',
    isAllDay: true,
    description: 'Prince\'s Day'
  },
  {
    id: 'monaco-2025-12-08',
    title: 'Immaculée Conception',
    date: '2025-12-08',
    isAllDay: true,
    description: 'Immaculate Conception'
  },
  {
    id: 'monaco-2025-12-25',
    title: 'Noël',
    date: '2025-12-25',
    isAllDay: true,
    description: 'Christmas Day'
  }
];

export const MONACO_HOLIDAYS_2026: MonacoHoliday[] = [
  {
    id: 'monaco-2026-01-01',
    title: 'Jour de l\'an',
    date: '2026-01-01',
    isAllDay: true,
    description: 'New Year\'s Day'
  },
  {
    id: 'monaco-2026-01-27',
    title: 'Ste Dévote',
    date: '2026-01-27',
    isAllDay: true,
    description: 'Saint Devote Day'
  },
  {
    id: 'monaco-2026-04-06',
    title: 'Lundi de Pâques',
    date: '2026-04-06',
    isAllDay: true,
    description: 'Easter Monday'
  },
  {
    id: 'monaco-2026-05-01',
    title: 'Fête du Travail',
    date: '2026-05-01',
    isAllDay: true,
    description: 'Labour Day'
  },
  {
    id: 'monaco-2026-05-14',
    title: 'Ascension',
    date: '2026-05-14',
    isAllDay: true,
    description: 'Ascension Day'
  },
  {
    id: 'monaco-2026-05-25',
    title: 'Lundi de Pentecôte',
    date: '2026-05-25',
    isAllDay: true,
    description: 'Whit Monday'
  },
  {
    id: 'monaco-2026-06-04',
    title: 'Fête-Dieu',
    date: '2026-06-04',
    isAllDay: true,
    description: 'Corpus Christi'
  },
  {
    id: 'monaco-2026-08-15',
    title: 'Assomption',
    date: '2026-08-15',
    isAllDay: true,
    description: 'Assumption Day'
  },
  {
    // 01/11/2026 (dimanche) — date affichée telle quelle par la source officielle, sans report.
    id: 'monaco-2026-11-01',
    title: 'Toussaint',
    date: '2026-11-01',
    isAllDay: true,
    description: 'All Saints\' Day'
  },
  {
    id: 'monaco-2026-11-19',
    title: 'Fête du Prince',
    date: '2026-11-19',
    isAllDay: true,
    description: 'Prince\'s Day'
  },
  {
    id: 'monaco-2026-12-08',
    title: 'Immaculée Conception',
    date: '2026-12-08',
    isAllDay: true,
    description: 'Immaculate Conception'
  },
  {
    id: 'monaco-2026-12-25',
    title: 'Noël',
    date: '2026-12-25',
    isAllDay: true,
    description: 'Christmas Day'
  }
];

/**
 * Jours fériés 2027.
 * 01/01 et 27/01 confirmés par la source officielle (affichés au 2026-06-12).
 * Les autres dates suivent le catalogue officiel : fêtes fixes invariables,
 * fêtes mobiles selon le calendrier liturgique (Pâques 2027 = 28 mars).
 * À re-vérifier sur https://monservicepublic.gouv.mc/agenda/jours-feries
 * au fil de l'année, quand le site les affiche.
 */
export const MONACO_HOLIDAYS_2027: MonacoHoliday[] = [
  {
    id: 'monaco-2027-01-01',
    title: 'Jour de l\'an',
    date: '2027-01-01',
    isAllDay: true,
    description: 'New Year\'s Day'
  },
  {
    id: 'monaco-2027-01-27',
    title: 'Sainte Dévote',
    date: '2027-01-27',
    isAllDay: true,
    description: 'Saint Devote Day'
  },
  {
    id: 'monaco-2027-03-29',
    title: 'Lundi de Pâques',
    date: '2027-03-29',
    isAllDay: true,
    description: 'Easter Monday'
  },
  {
    id: 'monaco-2027-05-01',
    title: 'Fête du Travail',
    date: '2027-05-01',
    isAllDay: true,
    description: 'Labour Day'
  },
  {
    id: 'monaco-2027-05-06',
    title: 'Ascension',
    date: '2027-05-06',
    isAllDay: true,
    description: 'Ascension Day'
  },
  {
    id: 'monaco-2027-05-17',
    title: 'Lundi de Pentecôte',
    date: '2027-05-17',
    isAllDay: true,
    description: 'Whit Monday'
  },
  {
    id: 'monaco-2027-05-27',
    title: 'Fête-Dieu',
    date: '2027-05-27',
    isAllDay: true,
    description: 'Corpus Christi'
  },
  {
    // 15/08/2027 tombe un dimanche — comme la Toussaint 2026, la source
    // officielle n'applique pas de report : date conservée telle quelle.
    id: 'monaco-2027-08-15',
    title: 'Assomption',
    date: '2027-08-15',
    isAllDay: true,
    description: 'Assumption Day'
  },
  {
    id: 'monaco-2027-11-01',
    title: 'Toussaint',
    date: '2027-11-01',
    isAllDay: true,
    description: 'All Saints\' Day'
  },
  {
    id: 'monaco-2027-11-19',
    title: 'Fête du Prince',
    date: '2027-11-19',
    isAllDay: true,
    description: 'Prince\'s Day'
  },
  {
    id: 'monaco-2027-12-08',
    title: 'Immaculée Conception',
    date: '2027-12-08',
    isAllDay: true,
    description: 'Immaculate Conception'
  },
  {
    id: 'monaco-2027-12-25',
    title: 'Noël',
    date: '2027-12-25',
    isAllDay: true,
    description: 'Christmas Day'
  }
];

/**
 * Get Monaco holidays for a specific year
 */
export function getMonacoHolidays(year: number): MonacoHoliday[] {
  if (year === 2025) {
    return MONACO_HOLIDAYS_2025;
  } else if (year === 2026) {
    return MONACO_HOLIDAYS_2026;
  } else if (year === 2027) {
    return MONACO_HOLIDAYS_2027;
  }
  return [];
}

/**
 * Get Monaco holidays for a date range
 */
export function getMonacoHolidaysInRange(startDate: Date, endDate: Date): MonacoHoliday[] {
  const holidays: MonacoHoliday[] = [];
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  
  for (let year = startYear; year <= endYear; year++) {
    const yearHolidays = getMonacoHolidays(year);
    holidays.push(...yearHolidays.filter(holiday => {
      // Parse holiday date as local time to match calendar date comparison
      const [year, month, day] = holiday.date.split('-').map(Number);
      const holidayDate = new Date(year, month - 1, day);
      return holidayDate >= startDate && holidayDate <= endDate;
    }));
  }
  
  return holidays;
}

/**
 * Check if a specific date is a Monaco holiday
 */
export function isMonacoHoliday(date: Date): MonacoHoliday | null {
  const year = date.getFullYear();
  const holidays = getMonacoHolidays(year);
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  return holidays.find(holiday => holiday.date === dateStr) || null;
}
