/** Hands out tickets; only the newest ticket is "current", so a slow old reply cannot overwrite a newer one. */
export function createLatestOnly() {
  let latest = 0;
  return {
    begin(): () => boolean {
      const mine = ++latest;
      return () => mine === latest;
    },
    cancel(): void {
      latest++;
    },
  };
}
