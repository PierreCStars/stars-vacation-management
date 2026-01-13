'use client';

import { useTranslations } from 'next-intl';

/**
 * REQUIRED Google Calendar embed URL - this is the ONLY source for embedded calendar events
 * Calendar ID: c_1ee147e8254f6b2d5985d9ce6c4f9b39983d00cdcfe3c3732fa3aa33a1e30e0e@group.calendar.google.com
 * Timezone: Europe/Monaco
 */
const EMBED_CALENDAR_URL = 'https://calendar.google.com/calendar/embed?src=c_1ee147e8254f6b2d5985d9ce6c4f9b39983d00cdcfe3c3732fa3aa33a1e30e0e%40group.calendar.google.com&ctz=Europe%2FMonaco';

interface EmbeddedCalendarProps {
  height?: string;
  className?: string;
}

/**
 * EmbeddedCalendar - Displays Google Calendar events via iframe embed
 * This is the ONLY mechanism for displaying calendar events in the embedded calendar section.
 * No API routes, no event fetching, no parsing - just a direct iframe embed.
 */
export default function EmbeddedCalendar({ 
  height = '600px',
  className = ''
}: EmbeddedCalendarProps) {
  const tCalendar = useTranslations('calendar');

  // Dev-only validation guard
  if (process.env.NODE_ENV === 'development') {
    const url = new URL(EMBED_CALENDAR_URL);
    const src = url.searchParams.get('src');
    const ctz = url.searchParams.get('ctz');
    
    if (!src?.includes('c_1ee147e8254f6b2d5985d9ce6c4f9b39983d00cdcfe3c3732fa3aa33a1e30e0e@group.calendar.google.com')) {
      console.error('[EmbeddedCalendar] Invalid calendar ID in embed URL');
    }
    if (ctz !== 'Europe/Monaco') {
      console.warn('[EmbeddedCalendar] Timezone mismatch - expected Europe/Monaco');
    }
  }

  return (
    <div className={`w-full ${className}`} style={{ minHeight: height }}>
      <iframe
        src={EMBED_CALENDAR_URL}
        style={{
          width: '100%',
          height: height,
          border: 0,
          borderRadius: '8px',
        }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={tCalendar('starsVacationCalendar') || 'Stars Vacation Calendar'}
        aria-label={tCalendar('starsVacationCalendar') || 'Stars Vacation Calendar'}
      />
    </div>
  );
}
