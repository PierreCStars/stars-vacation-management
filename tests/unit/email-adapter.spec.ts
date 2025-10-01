import { describe, it, expect, beforeEach } from 'vitest';
import { FakeEmailAdapter, FakeInbox, clearInbox } from '@/lib/email/fake';

describe('Email adapter', () => {
  beforeEach(() => clearInbox());
  
  it('stores admin notify and requester emails', async () => {
    await FakeEmailAdapter.send({ type: 'ADMIN_NOTIFY', to: ['a@x','b@y'], requestId: 'R1' });
    await FakeEmailAdapter.send({ type: 'REQUEST_SUBMITTED', to: 'u@stars.mc', requestId: 'R1' });
    expect(FakeInbox.length).toBe(2);
  });
  
  it('stores decision emails correctly', async () => {
    await FakeEmailAdapter.send({ 
      type: 'REQUEST_DECISION', 
      to: 'user@stars.mc', 
      requestId: 'R1', 
      decision: 'APPROVED' 
    });
    
    expect(FakeInbox.length).toBe(1);
    expect(FakeInbox[0].type).toBe('REQUEST_DECISION');
    expect((FakeInbox[0] as any).decision).toBe('APPROVED');
  });
});






