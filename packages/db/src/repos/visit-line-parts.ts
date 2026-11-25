import { isFdiTooth, isToothSurface, type ToothSurface } from "@clinic/shared";
import { InvalidError } from "../errors";

export function parseSurfaces(raw: string): ToothSurface[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s): s is ToothSurface => typeof s === "string" && isToothSurface(s));
  } catch {
    return [];
  }
}

export function assertTooth(fdi: number | null | undefined) {
  if (fdi != null && !isFdiTooth(fdi)) {
    throw new InvalidError("Tooth number must be a valid FDI number such as 36 or 85.");
  }
}

export function assertSurfaces(surfaces: readonly string[] | undefined) {
  if (surfaces && !surfaces.every((x) => isToothSurface(x))) {
    throw new InvalidError("Surfaces must be O, M, D, B or L.");
  }
}
