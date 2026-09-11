import { decodeCursor, encodeCursor, parseLimit } from './pagination';

describe('pagination', () => {
  it('defaults and clamps limit', () => {
    expect(parseLimit(undefined)).toBe(20);
    expect(parseLimit(3)).toBe(3);
    expect(parseLimit(99)).toBe(50);
    expect(parseLimit(0)).toBe(20);
  });

  it('round-trips cursor', () => {
    const createdAt = new Date('2026-03-12T00:00:00.000Z');
    const cursor = encodeCursor(createdAt, 'abc');
    expect(decodeCursor(cursor)).toEqual({ createdAt, id: 'abc' });
  });
});
