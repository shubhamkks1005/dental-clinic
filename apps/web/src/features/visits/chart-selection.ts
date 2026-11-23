import type { FdiTooth, ToothSurface } from "@clinic/shared";

/** The tooth and surfaces picked on the chart; the next procedure is added for them. */
export type ChartSelection = {
  tooth: FdiTooth;
  surfaces: ToothSurface[];
};
