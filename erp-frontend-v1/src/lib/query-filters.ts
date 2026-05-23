/**
 * Build a stable, API-safe filters object for query keys and HTTP params.
 * - Removes undefined/null values
 * - Removes empty strings after trimming
 * - Keeps valid falsy values (0, false)
 */
export function normalizeQueryFilters<T extends object>(
  filters: T,
): Partial<T> {
  const normalized: Partial<T> = {};

  for (const [rawKey, rawValue] of Object.entries(
    filters as Record<string, unknown>,
  )) {
    const key = rawKey as keyof T;
    const value = rawValue as T[keyof T];

    if (value === undefined || value === null) continue;

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length === 0) continue;
      normalized[key] = trimmed as T[keyof T];
      continue;
    }

    normalized[key] = value;
  }

  return normalized;
}
