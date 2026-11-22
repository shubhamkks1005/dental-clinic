import type { DayWindow } from "@clinic/shared";
import { describe, expect, it } from "vitest";
import type { DayAppointment } from "../appointments";
import { buildTodayModel } from "./buildTodayModel";

const window: DayWindow = {
  dateLocal: "2026-11-23",
  dayStartMin: 10 * 60,
  dayEndMin: 12 * 60,
  slotMinutes: 15,
  intervals: [[10 * 60, 12 * 60]],
  closed: false,
};

function appt(
  over: Partial<DayAppointment> & Pick<DayAppointment, "id" | "status">,
): DayAppointment {
  return {
    patientId: "p1",
    patientCode: "P-000001",
    patientName: "Fake One",
    patientMobile: "+919800000001",
    visitTypeId: "v1",
    visitTypeLabel: "Consultation",
    startAt: "2026-11-23T04:30:00.000Z",
    dateLocal: "2026-11-23",
    startMin: 10 * 60,
    endMin: 10 * 60 + 30,
    priority: "normal",
    overbook: false,
    complaint: null,
    arrivedAt: null,
    startedAt: null,
    endedAt: null,
    updatedAt: "2026-11-23T04:00:00.000Z",
    version: 1,
    ...over,
  };
}

describe("buildTodayModel (2.4.3)", () => {
  it("picks emergency waiting first as next and lists no-shows for call list", () => {
    const model = buildTodayModel(
      [
        appt({
          id: "a1",
          status: "arrived",
          priority: "normal",
          arrivedAt: "2026-11-23T04:00:00.000Z",
          patientName: "Normal Wait",
        }),
        appt({
          id: "a2",
          status: "arrived",
          priority: "emergency",
          startMin: 10 * 60 + 30,
          endMin: 11 * 60,
          arrivedAt: "2026-11-23T04:10:00.000Z",
          patientName: "Emergency Wait",
          patientCode: "P-000002",
        }),
        appt({
          id: "a3",
          status: "no_show",
          patientName: "Missed Person",
          patientMobile: null,
        }),
      ],
      window,
      "2026-11-23T05:00:00.000Z",
    );
    expect(model.next?.name).toBe("Emergency Wait");
    expect(model.rows.find((r) => r.id === "a2")?.highlighted).toBe(true);
    expect(model.callList).toHaveLength(1);
    expect(model.callList[0]?.name).toBe("Missed Person");
    expect(model.waitingCount).toBe(2);
  });
});
