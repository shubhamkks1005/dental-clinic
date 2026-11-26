import { formatClockTime } from "@clinic/shared";
import type { DayAppointment } from "../api";
import { bookedMessage } from "../booked-message";
import { formatDate } from "../../../ui/format";
import { showCalToast, toastContent } from "./motion";

/** M10: after the morph, "Appointment confirmed and slotted on calendar" (3 s). Booked on a day
 * not on screen: where it went (existing bookedMessage). Moved: where to. */
export function bookedToast(row: DayAppointment, onScreen: boolean, moved: boolean) {
  const text = moved
    ? `Moved to ${formatDate(row.dateLocal)}, ${formatClockTime(row.startMin)}`
    : onScreen
      ? "Appointment confirmed and slotted on calendar"
      : bookedMessage(row.dateLocal, row.startMin);
  showCalToast((box) => toastContent(box, { icon: true, text: [text] }), 3000);
}

/** M20: "<code> Patient Registered · <name> · Proceeding to Slot", out at 3500 ms. */
export function registeredToast(code: string, name: string) {
  showCalToast(
    (box) =>
      toastContent(box, { chip: code, text: ["Patient Registered", name, "Proceeding to Slot"] }),
    3500,
  );
}

/** Save only (L13: no alert()). */
export function savedToast(code: string, name: string) {
  showCalToast(
    (box) => toastContent(box, { icon: true, text: [`Patient saved: ${code} ${name}`] }),
    3000,
  );
}
