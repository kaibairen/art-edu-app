import { parseDurationSeconds } from './auth.service';

describe('parseDurationSeconds', () => {
  it('parses compact duration strings', () => {
    expect(parseDurationSeconds('90')).toBe(90);
    expect(parseDurationSeconds('2h')).toBe(7200);
    expect(parseDurationSeconds('7d')).toBe(7 * 86400);
    expect(parseDurationSeconds('bogus')).toBe(7200);
  });
});
