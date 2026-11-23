import { formatClockTime, formatDisplayDate } from "@clinic/shared";

/** Toast text after a booking, so the desk sees where it went even on another day. */
export function bookedMessage(dateLocal: string, startMin: number): string {
  return `Booked for ${formatDisplayDate(dateLocal)}, ${formatClockTime(startMin)}`;
}
