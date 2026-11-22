/** English label for the Today incomplete-visits widget (3.5.8). */
export function incompleteVisitsLabel(count: number): string {
  if (count === 1) return "1 visit not finalised";
  return `${count} visits not finalised`;
}
