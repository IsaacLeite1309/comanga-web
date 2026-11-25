export interface CollectionReturn {
  page: number;
  scrollY: number;
}

export function readCollectionReturn(value: unknown): CollectionReturn | undefined {
  if (!value || typeof value !== "object") return undefined;
  const { page, scrollY } = value as Partial<CollectionReturn>;
  if (!Number.isSafeInteger(page) || !page || page < 1
    || typeof scrollY !== "number" || !Number.isFinite(scrollY) || scrollY < 0) return undefined;
  return { page, scrollY };
}
