export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 50;

export interface PageResult<T> {
  items: T[];
  nextCursor: string | null;
}

export function parseLimit(raw?: string | number): number {
  const n = typeof raw === 'number' ? raw : raw != null ? Number(raw) : DEFAULT_PAGE_LIMIT;
  if (!Number.isFinite(n) || n <= 0) {
    return DEFAULT_PAGE_LIMIT;
  }
  return Math.min(Math.floor(n), MAX_PAGE_LIMIT);
}

export function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(`${createdAt.toISOString()}|${id}`, 'utf8').toString('base64url');
}

export function decodeCursor(cursor?: string): { createdAt: Date; id: string } | null {
  if (!cursor) {
    return null;
  }
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const idx = raw.indexOf('|');
    if (idx <= 0) {
      return null;
    }
    const createdAt = new Date(raw.slice(0, idx));
    const id = raw.slice(idx + 1);
    if (!id || Number.isNaN(createdAt.getTime())) {
      return null;
    }
    return { createdAt, id };
  } catch {
    return null;
  }
}

export function cursorWhere(cursor?: string) {
  const decoded = decodeCursor(cursor);
  if (!decoded) {
    return undefined;
  }
  return {
    OR: [
      { createdAt: { lt: decoded.createdAt } },
      { createdAt: decoded.createdAt, id: { lt: decoded.id } },
    ],
  };
}

export function toPage<T extends { createdAt: Date; id: string }>(
  rows: T[],
  limit: number,
  map: (row: T) => unknown,
): PageResult<unknown> {
  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;
  const last = slice[slice.length - 1];
  return {
    items: slice.map(map),
    nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
  };
}
