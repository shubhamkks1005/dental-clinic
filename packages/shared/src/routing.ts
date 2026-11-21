export type Area =
  "staff-api" | "portal-api" | "hooks" | "unknown-api" | "staff-app" | "portal-app" | "asset";

export function areaOf(pathname: string): Area {
  if (underPrefix(pathname, "/api/staff")) return "staff-api";
  if (underPrefix(pathname, "/api/portal")) return "portal-api";
  if (underPrefix(pathname, "/api")) return "unknown-api";
  if (underPrefix(pathname, "/hooks")) return "hooks";
  if (underPrefix(pathname, "/app")) return "staff-app";
  if (underPrefix(pathname, "/my")) return "portal-app";
  return "asset";
}

export function isWorkerArea(area: Area): boolean {
  return (
    area === "staff-api" || area === "portal-api" || area === "hooks" || area === "unknown-api"
  );
}

// Whole path segments only, so "/application" is not "/app".
function underPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}
