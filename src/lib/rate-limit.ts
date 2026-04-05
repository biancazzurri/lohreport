const hits = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  windowMs: number,
  max: number
): boolean {
  const now = Date.now();
  const timestamps = hits.get(key) ?? [];
  const recent = timestamps.filter((t) => now - t < windowMs);
  if (recent.length >= max) return false;
  recent.push(now);
  hits.set(key, recent);
  return true;
}
