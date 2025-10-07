import { describe, it, expect, beforeEach } from 'vitest';
import { FakeCalendarGateway, __getFakeCalendarStore, __clearFakeCalendar } from '@/lib/calendar/fake';

describe('Calendar gateway (fake)', () => {
  beforeEach(() => __clearFakeCalendar());
  
  it('creates and deletes events', async () => {
    await FakeCalendarGateway.createEvent({ 
      requestId: 'R1', 
      start: '2025-10-01T00:00:00Z', 
      end: '2025-10-05T00:00:00Z', 
      summary: 'Vacation' 
    });
    expect(__getFakeCalendarStore().has('R1')).toBe(true);
    
    await FakeCalendarGateway.deleteEventByRequestId('R1');
    expect(__getFakeCalendarStore().has('R1')).toBe(false);
  });
  
  it('stores event data correctly', async () => {
    const input = {
      requestId: 'R2',
      start: '2025-11-01T00:00:00Z',
      end: '2025-11-03T00:00:00Z',
      summary: 'Test Vacation',
      description: 'Test Description'
    };
    
    const result = await FakeCalendarGateway.createEvent(input);
    expect(result.id).toBe('fake-R2');
    
    const stored = __getFakeCalendarStore().get('R2');
    expect(stored?.input).toEqual(input);
  });
});









