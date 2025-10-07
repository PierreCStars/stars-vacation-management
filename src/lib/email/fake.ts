import type { EmailAdapter, VacationEmail } from './types';

export const FakeInbox: VacationEmail[] = [];

export const FakeEmailAdapter: EmailAdapter = {
  async send(msg: VacationEmail) {
    FakeInbox.push(msg);
  },
};

export function clearInbox() {
  FakeInbox.length = 0;
}









