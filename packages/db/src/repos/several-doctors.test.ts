import type { Timings } from "@clinic/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { NotFoundError } from "../errors";
import { rebuildPatientSearchStatements } from "../search/patient-tokens";
import { addFakeDoctor, testDb } from "../testing";
import { createRepos } from "./index";

// Owner answers 2026-11-26 (appointments calendar handoff Q1-Q4): several doctors, each with their
// own chair, own list, own queue, own breaks, own requests and own leave days.
const docA: Ctx = { userId: "doc-a", role: "doctor", requestId: "a" };
const docB: Ctx = { userId: "doc-b", role: "doctor", requestId: "b" };
const desk: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r" };
const VISIT_ID = "01M83VTYPE01CONSULT000001"; // Consultation, 30 min
const DAY = "2026-11-23"; // Monday
const NOW = new Date("2026-11-23T03:30:00.000Z"); // 09:00 IST

const open = { open: true, start: "10:00", end: "19:00", lunchStart: null, lunchEnd: null };
const timings: Timings = {
  week: { mon: open, tue: open, wed: open, thu: open, fri: open, sat: open, sun: open },
  slotMinutes: 15,
  chairs: 1,
};
const opts = { timings, holidays: [], bookAheadDays: 90, now: NOW };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx) => createRepos(t.db, ctx);

async function patient(id: string, n: number) {
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', ?, ?, 'female', 30, ?, 'active')`,
    )
    .run(id, `P-00090${n}`, `Fake Many ${n}`, `+91990000100${n}`);
  await t.db.batch([
    ...rebuildPatientSearchStatements(
      t.db,
      id,
      {
        fullName: `Fake Many ${n}`,
        code: `P-00090${n}`,
        mobile: `+91990000100${n}`,
        mobileSecondary: null,
        legacyRef: null,
      },
      "system",
    ),
  ] as never);
}

const book = (ctx: Ctx, patientId: string, doctorId: string, startMin = 600) =>
  repos(ctx).appointments.book(
    {
      patientId,
      visitTypeId: VISIT_ID,
      doctorId,
      dateLocal: DAY,
      startMin,
      source: "phone",
      priority: "normal",
      complaint: null,
      overrideReason: null,
    },
    opts,
  );

beforeEach(async () => {
  t = testDb();
  addFakeDoctor(t.sqlite, "doc-a", "Dr. Fake Asha", "2026-01-01T00:00:00.000Z");
  addFakeDoctor(t.sqlite, "doc-b", "Dr. Fake Bina", "2026-02-01T00:00:00.000Z");
  await patient("p1", 1);
  await patient("p2", 2);
});

describe("doctor list", () => {
  it("lists active doctors in the order they were added, with fixed colours", async () => {
    const list = await repos(desk).doctors.listActive();
    expect(list.map((d) => [d.id, d.colourIndex])).toEqual([
      ["doc-a", 0],
      ["doc-b", 1],
    ]);
    expect(list[0]?.specialty).toBeNull();
  });
});

describe("own bookings only (T2)", () => {
  it("a doctor's day and range lists hold only their own rows; the desk sees both", async () => {
    await book(desk, "p1", "doc-a");
    await book(desk, "p2", "doc-b");
    const ids = async (ctx: Ctx) =>
      (await repos(ctx).appointments.listForDay(DAY)).map((r) => r.doctorId).sort();
    expect(await ids(docA)).toEqual(["doc-a"]);
    expect(await ids(docB)).toEqual(["doc-b"]);
    expect(await ids(desk)).toEqual(["doc-a", "doc-b"]);
    expect((await repos(docA).appointments.listForRange(DAY, DAY)).length).toBe(1);
  });
});

describe("move keeps doctor and length (P1.3.2)", () => {
  it("a move without doctor or length keeps both; a desk move may change the doctor", async () => {
    const first = await repos(desk).appointments.book(
      {
        patientId: "p1",
        visitTypeId: VISIT_ID,
        doctorId: "doc-a",
        durationMin: 75,
        dateLocal: DAY,
        startMin: 600,
        source: "phone",
        priority: "normal",
        complaint: null,
        overrideReason: null,
      },
      opts,
    );
    const moved = await repos(desk).appointments.reschedule(
      first.id,
      { version: first.version, dateLocal: DAY, startMin: 720, overrideReason: null },
      opts,
    );
    expect(moved.appointment.endMin - moved.appointment.startMin).toBe(75);
    expect(moved.appointment.doctorId).toBe("doc-a");
    const again = await repos(desk).appointments.reschedule(
      moved.appointment.id,
      {
        version: moved.appointment.version,
        dateLocal: DAY,
        startMin: 720,
        doctorId: "doc-b",
        durationMin: 30,
        overrideReason: null,
      },
      opts,
    );
    expect(again.appointment).toMatchObject({ doctorId: "doc-b", startMin: 720, endMin: 750 });
  });
});

describe("undo cancel with clashes allowed (P1.3.5, T19)", () => {
  it("comes back even when another patient took the time", async () => {
    const a = await book(desk, "p1", "doc-a");
    const cancelled = await repos(desk).appointments.cancel(a.id, {
      version: a.version,
      reason: "patient_request",
      note: null,
      notifyPatient: false,
    } as never);
    await book(desk, "p2", "doc-a");
    const back = await repos(desk).appointments.undoCancel(a.id, cancelled.version, NOW);
    expect(back.status).toBe("scheduled");
  });
});

describe("breaks per doctor (P1.5.3, T37)", () => {
  it("two doctors may be on break at once; each changes only their own", async () => {
    const a = await repos(docA).breaks.startBreak({ minutes: 10 }, NOW);
    await repos(docB).breaks.startBreak({ minutes: 15 }, NOW);
    await expect(repos(docA).breaks.startBreak({ minutes: 5 }, NOW)).rejects.toThrow(
      "A break is already on.",
    );
    await expect(repos(docB).breaks.endBreak(a.id, a.version, NOW)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    const deskSees = await repos(desk).breaks.openBreaks(DAY);
    expect(deskSees.map((b) => b.doctorName).sort()).toEqual(["Dr. Fake Asha", "Dr. Fake Bina"]);
    expect((await repos(docA).breaks.openBreaks(DAY)).map((b) => b.doctorId)).toEqual(["doc-a"]);
  });

  it("a patient in doctor A's chair does not stop doctor B's break (P1.3.6, T20)", async () => {
    const a = await book(desk, "p1", "doc-a");
    t.sqlite.prepare("UPDATE appointments SET status = 'in_chair' WHERE id = ?").run(a.id);
    await expect(repos(docA).breaks.startBreak({ minutes: 5 }, NOW)).rejects.toThrow(
      "Finish the visit in the chair first.",
    );
    await expect(repos(docB).breaks.startBreak({ minutes: 5 }, NOW)).resolves.toMatchObject({
      doctorId: "doc-b",
    });
  });
});

describe("a break never blocks the desk (P1.5.4, T37)", () => {
  it("the desk marks the doctor's patient arrived while the doctor is on break", async () => {
    const a = await book(desk, "p1", "doc-a");
    await repos(docA).breaks.startBreak({ minutes: 15 }, NOW);
    const arrived = await repos(desk).appointments.changeStatus(
      a.id,
      { status: "arrived", version: a.version, cancelReason: null },
      NOW,
    );
    expect(arrived.status).toBe("arrived");
  });
});

describe("queue per doctor (P1.5.2)", () => {
  it("skipping doctor A's patient never renumbers doctor B's rows", async () => {
    const a1 = await book(desk, "p1", "doc-a", 600);
    const b1 = await book(desk, "p2", "doc-b", 600);
    for (const id of [a1.id, b1.id]) {
      t.sqlite
        .prepare("UPDATE appointments SET status = 'arrived', arrived_at = ? WHERE id = ?")
        .run(NOW.toISOString(), id);
    }
    const bBefore = t.sqlite
      .prepare("SELECT queue_order, version FROM appointments WHERE id = ?")
      .get(b1.id);
    await repos(docA).appointments.skip(a1.id, a1.version, NOW);
    expect(
      t.sqlite.prepare("SELECT queue_order, version FROM appointments WHERE id = ?").get(b1.id),
    ).toEqual(bBefore);
  });
});

describe("approvals go to the patient's doctor (P1.5.5, T38)", () => {
  it("only the booking's doctor sees and answers the request", async () => {
    const b = await book(desk, "p2", "doc-b");
    const { id } = await repos(desk).approvals.createApproval({
      type: "emergency_insert",
      appointmentId: b.id,
      note: "Pain, wants 3 PM",
      urgent: false,
    });
    expect((await repos(docA).approvals.listOpenApprovals()).map((x) => x.id)).toEqual([]);
    expect((await repos(docB).approvals.listOpenApprovals()).map((x) => x.id)).toEqual([id]);
    await expect(
      repos(docA).approvals.answerApproval(id, "approve", undefined, 1),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("without a booking the desk must choose when there are several doctors", async () => {
    await expect(
      repos(desk).approvals.createApproval({
        type: "refund",
        patientId: "p1",
        note: "Refund?",
        urgent: false,
      }),
    ).rejects.toThrow("Choose the doctor to ask.");
    await expect(
      repos(desk).approvals.createApproval({
        type: "refund",
        patientId: "p1",
        doctorId: "doc-a",
        note: "Refund?",
        urgent: false,
      }),
    ).resolves.toHaveProperty("id");
  });
});

describe("walk-in doctor (P1.3.2)", () => {
  it("the desk must choose when there are several doctors; a doctor takes it themself", async () => {
    const body = {
      patientId: "p1",
      visitTypeId: VISIT_ID,
      priority: "normal" as const,
      complaint: null,
    };
    const later = { timings, holidays: [], now: new Date("2026-11-23T05:00:00.000Z") };
    await expect(repos(desk).appointments.walkIn(body, later)).rejects.toThrow("Choose a doctor.");
    const own = await repos(docB).appointments.walkIn(body, later);
    expect(t.sqlite.prepare("SELECT doctor_id FROM appointments WHERE id = ?").get(own.id)).toEqual(
      {
        doctor_id: "doc-b",
      },
    );
  });
});

describe("doctor leave (P1.3.4)", () => {
  it("a doctor manages own days; the desk only reads; one day once", async () => {
    await repos(docA).doctorLeaves.add({ doctorId: "doc-a", dateLocal: "2026-11-24", note: null });
    await expect(
      repos(docA).doctorLeaves.add({ doctorId: "doc-a", dateLocal: "2026-11-24", note: null }),
    ).rejects.toThrow("That doctor already has leave on that day.");
    await expect(
      repos(desk).doctorLeaves.add({ doctorId: "doc-a", dateLocal: "2026-11-25", note: null }),
    ).rejects.toThrow();
    const list = await repos(desk).doctorLeaves.list("2026-11-01", "2026-11-30");
    expect(list).toEqual([
      expect.objectContaining({
        doctorId: "doc-a",
        doctorName: "Dr. Fake Asha",
        dateLocal: "2026-11-24",
      }),
    ]);
    await repos(docA).doctorLeaves.remove(list[0]!.id, list[0]!.version, NOW);
    expect(await repos(desk).doctorLeaves.list("2026-11-01", "2026-11-30")).toEqual([]);
  });
});

describe("own letterhead (P1.6.2, T39)", () => {
  it("each doctor saves their own; the desk cannot", async () => {
    const a = await repos(docA).doctorProfiles.saveMine(
      {
        nameOnRx: "Dr. Fake Asha",
        qualifications: "BDS",
        speciality: "",
        registrationNo: "R-1",
        extraLine: "",
      },
      0,
    );
    expect(a.version).toBe(1);
    await repos(docB).doctorProfiles.saveMine(
      {
        nameOnRx: "Dr. Fake Bina",
        qualifications: "MDS",
        speciality: "Ortho",
        registrationNo: "R-2",
        extraLine: "",
      },
      0,
    );
    expect((await repos(desk).doctorProfiles.getFor("doc-a"))?.nameOnRx).toBe("Dr. Fake Asha");
    expect((await repos(desk).doctors.listActive()).map((d) => d.specialty)).toEqual([
      null,
      "Ortho",
    ]);
    await expect(repos(desk).doctorProfiles.getMine()).rejects.toThrow();
  });
});

describe("calendar search (P1.4.4, T33-T34)", () => {
  it("lists coming bookings of the chosen doctors; a doctor gets only own", async () => {
    await book(desk, "p1", "doc-a");
    await book(desk, "p1", "doc-b", 700);
    const all = await repos(desk).appointmentSearch.searchUpcoming("fake many 1", [], DAY);
    expect(all.map((h) => h.doctorName)).toEqual(["Dr. Fake Asha", "Dr. Fake Bina"]);
    const onlyA = await repos(desk).appointmentSearch.searchUpcoming("fake", ["doc-a"], DAY);
    expect(onlyA.map((h) => h.doctorId)).toEqual(["doc-a"]);
    const asB = await repos(docB).appointmentSearch.searchUpcoming("fake", ["doc-a"], DAY);
    expect(asB.map((h) => h.doctorId)).toEqual(["doc-b"]);
  });
});
