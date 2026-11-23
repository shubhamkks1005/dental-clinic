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

  describe("doctor view: nothing blocks the doctor", () => {
    const sched = (id: string, name: string, startMin: number, over = {}) =>
      appt({
        id,
        patientId: `p-${id}`,
        status: "scheduled",
        patientName: name,
        startMin,
        endMin: startMin + 30,
        ...over,
      });

    it("lists every patient of the day in time order, not just three", () => {
      const model = buildTodayModel(
        [
          sched("a4", "Four", 10 * 60 + 90),
          sched("a1", "One", 10 * 60),
          sched("a3", "Three", 10 * 60 + 60),
          sched("a2", "Two", 10 * 60 + 30),
          sched("a5", "Five", 10 * 60 + 120),
        ],
        window,
        "2026-11-23T04:00:00.000Z",
      );
      expect(model.doctorDay.map((r) => r.name)).toEqual(["One", "Two", "Three", "Four", "Five"]);
    });

    it("Now is the next upcoming patient when the desk marked nobody arrived", () => {
      const model = buildTodayModel(
        [sched("a2", "Second", 10 * 60 + 30), sched("a1", "First", 10 * 60)],
        window,
        "2026-11-23T04:00:00.000Z",
      );
      expect(model.doctorNow?.name).toBe("First");
    });

    it("Now prefers the patient in the chair, then an arrived one, then an upcoming one", () => {
      const rows = [
        sched("a1", "Upcoming", 10 * 60),
        sched("a2", "Arrived", 10 * 60 + 30, {
          status: "arrived",
          arrivedAt: "2026-11-23T04:00:00.000Z",
        }),
        sched("a3", "InChair", 11 * 60, { status: "in_chair" }),
      ];
      expect(buildTodayModel(rows, window, "2026-11-23T04:10:00.000Z").doctorNow?.name).toBe(
        "InChair",
      );
      expect(
        buildTodayModel(rows.slice(0, 2), window, "2026-11-23T04:10:00.000Z").doctorNow?.name,
      ).toBe("Arrived");
    });

    it("keeps finished patients in the list, drops cancelled ones, and has no Now when all done", () => {
      const model = buildTodayModel(
        [
          sched("a1", "Done", 10 * 60, { status: "completed" }),
          sched("a2", "Gone", 10 * 60 + 30, { status: "cancelled" }),
        ],
        window,
        "2026-11-23T05:00:00.000Z",
      );
      expect(model.doctorDay.map((r) => r.name)).toEqual(["Done"]);
      expect(model.doctorNow).toBeNull();
    });
  });

  it("counts ready-to-bill rows and links to the bill, or the Billing tab when there is none (Q1.2)", () => {
    const model = buildTodayModel(
      [
        appt({ id: "a1", status: "in_chair", readyToBill: { billId: "b1" } }),
        appt({ id: "a2", status: "in_chair", patientId: "p2", readyToBill: { billId: null } }),
        appt({ id: "a3", status: "scheduled", patientId: "p3" }),
      ],
      window,
      "2026-11-23T04:40:00.000Z",
    );
    expect(model.readyToBillCount).toBe(2);
    const link = (id: string) => model.rows.find((r) => r.id === id)?.payLink;
    expect(link("a1")).toBe("/app/bills/b1");
    expect(link("a2")).toBe("/app/patients/p2?tab=billing");
    expect(link("a3")).toBeNull();
  });

  it("Q1.8: open slots count only times from now until closing", () => {
    const rows: DayAppointment[] = [];
    const morning = buildTodayModel(rows, window, "2026-11-23T03:30:00.000Z"); // 09:00 IST
    const afternoon = buildTodayModel(rows, window, "2026-11-23T08:30:00.000Z"); // 14:00 IST
    const after = buildTodayModel(rows, window, "2026-11-23T14:30:00.000Z"); // 20:00 IST
    expect(afternoon.openSlots).toBeLessThan(morning.openSlots);
    expect(after.openSlots).toBe(0);
  });

  describe("Q2.5 stat strip and doctor lists", () => {
    const at = "2026-11-23T04:40:00.000Z";

    it("Waiting does not count the patient in the chair; In chair has its own count and name", () => {
      const model = buildTodayModel(
        [
          appt({ id: "a1", status: "arrived", arrivedAt: "2026-11-23T04:30:00.000Z" }),
          appt({ id: "a2", status: "in_chair", patientId: "p2", patientName: "In The Chair" }),
          appt({ id: "a3", status: "scheduled", patientId: "p3" }),
        ],
        window,
        at,
      );
      expect(model.waitingCount).toBe(1);
      expect(model.inChairCount).toBe(1);
      expect(model.inChairName).toBe("In The Chair");
      expect(model.next?.waiting).toBe("Waiting 10 min");
    });

    it("Ready to bill adds up what is still to collect, or says unknown when an amount is missing", () => {
      const ready = (id: string, due: number | null) =>
        appt({
          id,
          status: "completed",
          patientId: id,
          duePaise: due,
          readyToBill: { billId: null },
        });
      const known = buildTodayModel([ready("a1", 120000), ready("a2", 230000)], window, at);
      expect(known.readyToBillPaise).toBe(350000);
      const unknown = buildTodayModel([ready("a1", 120000), ready("a2", null)], window, at);
      expect(unknown.readyToBillPaise).toBeNull();
    });

    it("Next lists up to 3 waiting-first patients after Now; the rest of the day keeps everyone else", () => {
      const sched = (id: string, name: string, startMin: number, extra = {}) =>
        appt({ id, status: "scheduled", patientId: id, patientName: name, startMin, ...extra });
      const model = buildTodayModel(
        [
          sched("a0", "Chair", 10 * 60, { status: "in_chair" }),
          sched("a1", "Later A", 10 * 60 + 15),
          sched("a2", "Later B", 10 * 60 + 30),
          sched("a3", "Waits", 10 * 60 + 45, {
            status: "arrived",
            arrivedAt: "2026-11-23T04:20:00.000Z",
          }),
          sched("a4", "Later C", 11 * 60),
          sched("a5", "Finished", 9 * 60, { status: "completed" }),
        ],
        window,
        at,
      );
      expect(model.doctorNow?.name).toBe("Chair");
      expect(model.doctorNext.map((r) => r.name)).toEqual(["Waits", "Later A", "Later B"]);
      expect(model.doctorRest.map((r) => r.name).sort()).toEqual(["Finished", "Later C"]);
      expect(model.doctorDoneCount).toBe(1);
    });
  });
});
