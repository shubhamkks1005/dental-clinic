// Keyboard rules for a tab list (WAI-ARIA tabs pattern): arrows move and wrap around, Home and
// End jump to the ends. Returns the new index, or null for any other key.
export function nextTabIndex(current: number, key: string, count: number): number | null {
  if (count === 0) return null;
  if (key === "ArrowRight") return (current + 1) % count;
  if (key === "ArrowLeft") return (current - 1 + count) % count;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}
