import { formatClockTime } from "@clinic/shared";
import { formatDate } from "../../ui/format";

/** Toast text after a booking, so the desk sees where it went even on another day. */
export function bookedMessage(dateLocal: string, startMin: number): string {
  return `Booked for ${formatDate(dateLocal)}, ${formatClockTime(startMin)}`;
}
