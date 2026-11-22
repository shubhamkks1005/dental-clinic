import type { ChartFacing, FdiTooth, ToothSurface } from "@clinic/shared";
import { flatTeeth, SURFACE_ORDER } from "./chart-layout";
import type { ChartDentition } from "./chart-layout";

export type ChartFocus = { tooth: FdiTooth; surface: ToothSurface };

export function initialFocus(
  dentition: ChartDentition,
  facing: ChartFacing = "dentist",
): ChartFocus {
  const teeth = flatTeeth(dentition, facing);
  return { tooth: teeth[0] ?? 11, surface: "o" };
}

export function moveFocus(
  focus: ChartFocus,
  dentition: ChartDentition,
  key: "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown",
  facing: ChartFacing = "dentist",
): ChartFocus {
  const teeth = flatTeeth(dentition, facing);
  const toothIndex = Math.max(0, teeth.indexOf(focus.tooth));
  const surfaceIndex = Math.max(0, SURFACE_ORDER.indexOf(focus.surface));

  if (key === "ArrowLeft" || key === "ArrowRight") {
    const delta = key === "ArrowRight" ? 1 : -1;
    const next = teeth[(toothIndex + delta + teeth.length) % teeth.length]!;
    return { tooth: next, surface: focus.surface };
  }

  const sDelta = key === "ArrowDown" ? 1 : -1;
  const nextSurface =
    SURFACE_ORDER[(surfaceIndex + sDelta + SURFACE_ORDER.length) % SURFACE_ORDER.length]!;
  return { tooth: focus.tooth, surface: nextSurface };
}
