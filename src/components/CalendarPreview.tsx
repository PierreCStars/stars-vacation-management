import React from 'react';
import Segmented from '@/components/ui/Segmented';
import LegendPill from '@/components/ui/LegendPill';

export default function CalendarPreview(props: any) {
  const { view, setView, rangeLabel, fullCalendarUrl, legend = [] } = props;
  
  return (
    <section className="mt-8 rounded-2xl overflow-hidden shadow-card">
      <div className="bg-brand text-white px-6 py-3 flex items-center justify-between">
        <h2 className="font-semibold">Stars Vacation Calendar</h2>
        <div className="flex items-center gap-2">
          <Segmented options={['Week','Month']} value={view} onChange={setView} />
          <span className="text-sm opacity-90">{rangeLabel}</span>
          <a 
            href={fullCalendarUrl} 
            className="ml-2 px-3 py-1.5 rounded-lg bg-white/90 text-brand hover:bg-white transition-colors"
          >
            Open Full
          </a>
        </div>
      </div>
      <div className="bg-white p-4 md:p-6">
        {/* Calendar grid placeholder */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
          {Array.from({ length: 35 }, (_, i) => (
            <div 
              key={i} 
              className="h-12 border border-gray-100 rounded flex items-center justify-center text-sm text-gray-400"
            >
              {i < 7 ? i + 1 : ''}
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-2">
          {legend.map((l: any) => (
            <LegendPill key={l.label} color={l.color} label={l.label} />
          ))}
        </div>
      </div>
    </section>
  );
}


