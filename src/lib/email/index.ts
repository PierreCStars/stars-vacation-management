import { RealEmailAdapter } from './real';
import { FakeEmailAdapter } from './fake';

export function emailAdapter() {
  return process.env.E2E_USE_FAKE === '1' ? FakeEmailAdapter : RealEmailAdapter;
}









