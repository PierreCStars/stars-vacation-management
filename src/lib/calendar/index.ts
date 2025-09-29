import { RealCalendarGateway } from './real';
import { FakeCalendarGateway } from './fake';

export function calendarGateway() {
  return process.env.E2E_USE_FAKE === '1' ? FakeCalendarGateway : RealCalendarGateway;
}

export { RealCalendarGateway, FakeCalendarGateway };
