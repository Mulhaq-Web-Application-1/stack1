/**
 * Keyset (cursor) pagination helpers.
 * Use instead of OFFSET for large tables so Postgres doesn't scan all previous rows.
 *
 * @example
 * const [items, nextCursor] = await findManyWithCursor(
 *   prisma.group.findMany,
 *   { where: { userId }, orderBy: { id: "asc" }, take: pageSize + 1 },
 *   cursor,
 *   pageSize
 * );
 */
export function cursorOptions<T extends Record<string, unknown>>(
  cursor: string | undefined,
  cursorField: keyof T = "id" as keyof T,
  skip = 1
): { cursor?: T; skip: number } {
  if (!cursor) return { skip: 0 };
  return {
    cursor: { [cursorField]: cursor } as T,
    skip,
  };
}

/**
 * Slice results to pageSize and return next cursor if there are more.
 */
export function withNextCursor<T extends { id: string }>(
  items: T[],
  pageSize: number
): [items: T[], nextCursor: string | null] {
  const hasMore = items.length > pageSize;
  const page = hasMore ? items.slice(0, pageSize) : items;
  const nextCursor = hasMore ? page[page.length - 1].id : null;
  return [page, nextCursor];
}
