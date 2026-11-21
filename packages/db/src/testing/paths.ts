// Absolute paths computed from this file, so tests in any package find the same folders.
const HERE = decodeURIComponent(import.meta.url.replace(/^file:\/\//, "").replace(/[^/]*$/, ""));

export const REPO_ROOT = `${HERE}../../../../`;
export const DB_MIGRATIONS = `${HERE}../../migrations/`;
