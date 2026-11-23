import { createDb, createRepos, type D1Binding, type Repos } from "@clinic/db";
import { istDate } from "@clinic/shared";
import {
  bookAppointment,
  cancelAppointment,
  changeAppointmentStatus,
} from "../domain/appointments";
import { createPatient } from "../domain/patients";
import {
  addVisitDiagnosis,
  finaliseVisit,
  getVisit,
  openVisit,
  patchVisit,
} from "../domain/visits";
import { SEED_MARKER, seedPeople } from "./staging-seed-data";
import { addDays, at, must, type Flow, type Obj, type SeedReport } from "./staging-seed-core";
import { seedRequests } from "./staging-seed-requests";
import { billAndPay, closeSeedDay, prescribe } from "./staging-seed-money";

export type { SeedReport } from "./staging-seed-core";

// Staging seed (task: staging readiness). Everything goes through the same domain functions
// the staff app uses, so locks, numbers, audit rows and permissions behave exactly as in real use.

const TYPE_CONSULT = "01M83VTYPE01CONSULT000001";
const TYPE_FOLLOWUP = "01M83VTYPE02FOLLOWUP00001";
const SLOTS = [600, 630, 660, 690, 720, 750, 780, 870, 900, 930];
const CLOSED_DAY_OFFSET = -7;

export async function runStagingSeed(d1: D1Binding, now: Date = new Date()): Promise<SeedReport> {
  const db = createDb(d1);
  const doc = createRepos(db, { userId: "system", role: "doctor", requestId: "seed-staging" });
  const rec = createRepos(db, {
    userId: "system",
    role: "receptionist",
    requestId: "seed-staging",
  });
  const report: SeedReport = {
    patients: 0,
    requests: 0,
    appointments: 0,
    visitsFinal: 0,
    visitsOpen: 0,
    prescriptions: 0,
    bills: 0,
    payments: 0,
    refunds: 0,
    closedDay: null,
    skipped: [],
  };

  const ids = await seedPatients(rec, report, now);
  await seedRequests(doc, rec, ids, report);
  const today = istDate(now);
  let k = 0;
  let refundDone = false;
  for (let off = -14; off <= 14; off++) {
    const day = addDays(today, off);
    if (new Date(`${day}T00:00:00Z`).getUTCDay() === 0) continue; // clinic closed Sundays
    const perDay = 2 + (Math.abs(off) % 3);
    for (let s = 0; s < perDay; s++, k++) {
      const patientId = ids[(k * 7) % ids.length]!;
      const slot = SLOTS[s]!;
      const clock = at(day, 540); // book "that morning" so past/ahead rules never trip
      const booked = await bookAppointment(
        rec,
        {
          patientId,
          visitTypeId: s === 0 ? TYPE_CONSULT : TYPE_FOLLOWUP,
          dateLocal: day,
          startMin: slot,
          source: "phone",
          complaint: "Fake complaint (seed)",
        },
        clock,
      );
      if (!booked.ok) {
        report.skipped.push(`${day} ${slot}: ${booked.message}`);
        continue;
      }
      report.appointments++;
      const appt = booked.appointment as Obj;
      const flow = { day, slot, patientId, appt, k, off };
      if (off < 0) {
        const r = await pastVisit(doc, rec, flow, report, !refundDone);
        refundDone ||= r.refunded;
      } else if (off === 0 && s === 0) await arrive(rec, appt, day, slot, "arrived");
      else if (off === 0 && s === 1) await openChair(doc, rec, flow, report);
      else if (off > 0 && s === 0) await confirm(rec, appt, day);
    }
  }
  await closeSeedDay(rec, addDays(today, CLOSED_DAY_OFFSET), report);
  return report;
}

async function seedPatients(rec: Repos, report: SeedReport, now: Date): Promise<string[]> {
  const ids: string[] = [];
  for (const p of seedPeople()) {
    const r = must(
      await createPatient(
        rec,
        {
          ...p,
          notes: SEED_MARKER,
          consents: { noticeShown: true, smsReminders: true, marketing: false },
        },
        now,
      ),
      "patient",
    );
    ids.push((r as Obj).patient.id);
    report.patients++;
  }
  return ids;
}

async function setStatus(rec: Repos, appt: Obj, status: string, when: Date): Promise<Obj> {
  const r = must(
    await changeAppointmentStatus(
      rec,
      appt.id,
      {
        status,
        version: appt.version,
        // Missed needs a reason (Q1.4).
        ...(status === "no_show" ? { cancelReason: "Seed data: did not come" } : {}),
      },
      when,
    ),
    status,
  );
  return (r as Obj).appointment;
}

async function confirm(rec: Repos, appt: Obj, day: string) {
  await setStatus(rec, appt, "confirmed", at(day, 540));
}

async function arrive(rec: Repos, appt: Obj, day: string, slot: number, to: "arrived") {
  await setStatus(rec, appt, to, at(day, slot - 5));
}

async function openChair(doc: Repos, rec: Repos, f: Flow, report: SeedReport) {
  let a = await setStatus(rec, f.appt, "arrived", at(f.day, f.slot - 5));
  a = await setStatus(rec, a, "in_chair", at(f.day, f.slot));
  must(
    await openVisit(doc, { patientId: f.patientId, appointmentId: a.id, visitDateLocal: f.day }),
    "open visit",
  );
  report.visitsOpen++;
}

async function pastVisit(doc: Repos, rec: Repos, f: Flow, report: SeedReport, wantRefund: boolean) {
  const out = { refunded: false };
  if (f.k % 9 === 4) {
    // a no-show
    await setStatus(rec, f.appt, "no_show", at(f.day, f.slot + 90));
    return out;
  }
  if (f.k % 9 === 7) {
    // a cancellation
    must(
      await cancelAppointment(rec, f.appt.id, {
        version: f.appt.version,
        reason: "patient_request",
      }),
      "cancel",
    );
    return out;
  }
  let a = await setStatus(rec, f.appt, "arrived", at(f.day, f.slot - 5));
  a = await setStatus(rec, a, "in_chair", at(f.day, f.slot));
  const open = must(
    await openVisit(doc, { patientId: f.patientId, appointmentId: a.id, visitDateLocal: f.day }),
    "open",
  );
  const visitId = (open as Obj).visit.id as string;
  const isOpenDraft = f.off === -1 && f.slot === SLOTS[1];
  if (isOpenDraft) {
    // left as a draft (doctor forgot to finalise)
    report.visitsOpen++;
    await setStatus(rec, a, "completed", at(f.day, f.slot + 30));
    return out;
  }
  must(
    await patchVisit(doc, visitId, {
      version: (open as Obj).visit.version,
      chiefComplaint: "Fake toothache (seed)",
      examNote: "Fake exam note (seed)",
      advice: "Fake advice (seed)",
    }),
    "patch",
  );
  must(
    await addVisitDiagnosis(doc, visitId, { freeText: "Fake diagnosis (seed)", toothFdi: 16 }),
    "diagnosis",
  );
  const latest = must(await getVisit(doc, visitId), "get visit");
  must(await finaliseVisit(doc, visitId, { version: (latest as Obj).visit.version }), "finalise");
  report.visitsFinal++;
  await setStatus(rec, a, "completed", at(f.day, f.slot + 30));
  if (f.k % 2 === 0) await prescribe(doc, f, visitId, report);
  if (f.k % 9 !== 8) out.refunded = await billAndPay(doc, rec, f, visitId, report, wantRefund);
  return out;
}
