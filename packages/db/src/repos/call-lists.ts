import {
  addIstDays,
  istDate,
  newUlid,
  parseCallListKind,
  parseOutreachContact,
  tunableDefault,
  type CallListKind,
  type CallListRow,
} from "@clinic/shared";
import { and, eq, isNull, sql } from "drizzle-orm";
import { auditInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { InvalidError } from "../errors";
import { assertAllowed } from "../permissions";
import { outreachContacts, patients, planItems, settings, visits } from "../schema";

async function intSetting(db: Db, key: string, fallback: number): Promise<number> {
  const row = await db
    .select({ valueJson: settings.valueJson })
    .from(settings)
    .where(and(eq(settings.key, key), isNull(settings.deletedAt)))
    .get();
  if (!row) return fallback;
  const n = JSON.parse(row.valueJson) as unknown;
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

/** 6.3.7 / 6.5.3: incomplete + recall call lists (thresholds from settings). */
export function callListsRepo(db: Db, ctx: Ctx) {
  return {
    async list(kindRaw: string, now: Date = new Date()): Promise<CallListRow[]> {
      assertAllowed(ctx, "reports.full");
      const kind = parseCallListKind.safeParse(kindRaw);
      if (!kind.success) throw new InvalidError("Choose incomplete or recall.");
      const today = istDate(now);
      if (kind.data === "incomplete") {
        const days = await intSetting(
          db,
          "outreach.incomplete_days",
          tunableDefault("outreach.incomplete_days"),
        );
        return listIncomplete(db, today, days);
      }
      const minM = await intSetting(
        db,
        "outreach.recall_min_months",
        tunableDefault("outreach.recall_min_months"),
      );
      const maxM = await intSetting(
        db,
        "outreach.recall_max_months",
        tunableDefault("outreach.recall_max_months"),
      );
      return listRecall(db, today, minM, maxM);
    },

    async contact(
      kindRaw: string,
      patientId: string,
      body: unknown,
      now: Date = new Date(),
    ): Promise<{ ok: true }> {
      assertAllowed(ctx, "reports.full");
      const kind = parseCallListKind.safeParse(kindRaw);
      if (!kind.success) throw new InvalidError("Choose incomplete or recall.");
      const parsed = parseOutreachContact.safeParse(body);
      if (!parsed.success) throw new InvalidError("Add a short contact note.");
      const patient = await db
        .select({ id: patients.id })
        .from(patients)
        .where(and(eq(patients.id, patientId), isNull(patients.deletedAt)))
        .get();
      if (!patient) throw new InvalidError("Patient not found.");
      const id = newUlid();
      const contactedOn = istDate(now);
      const nowIso = now.toISOString();
      await db.batch([
        db.insert(outreachContacts).values({
          id,
          patientId,
          listKind: kind.data,
          note: parsed.data.note,
          contactedOn,
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
          createdAt: nowIso,
          updatedAt: nowIso,
        }),
        auditInsert(db, ctx, {
          action: "create",
          table: "outreach_contacts",
          rowId: id,
          after: { patientId, listKind: kind.data, contactedOn },
        }),
      ]);
      return { ok: true };
    },
  };
}

async function hiddenPatientIds(db: Db, kind: CallListKind): Promise<Set<string>> {
  const rows = await db
    .select({ patientId: outreachContacts.patientId })
    .from(outreachContacts)
    .where(
      and(
        eq(outreachContacts.listKind, kind),
        isNull(outreachContacts.deletedAt),
        sql`not exists (
          select 1 from visits v
          where v.patient_id = ${outreachContacts.patientId}
            and v.status = 'final'
            and v.deleted_at is null
            and v.visit_date_local > ${outreachContacts.contactedOn}
        )`,
      ),
    )
    .all();
  return new Set(rows.map((r) => r.patientId));
}

async function listIncomplete(
  db: Db,
  today: string,
  incompleteDays: number,
): Promise<CallListRow[]> {
  const cutoff = addIstDays(today, -incompleteDays);
  const hidden = await hiddenPatientIds(db, "incomplete");
  const rows = await db
    .select({
      patientId: planItems.patientId,
      patientCode: patients.code,
      patientName: patients.fullName,
      label: planItems.procedureLabel,
      amountPaise: planItems.estimatePaise,
      toldOn: planItems.toldOn,
      createdAt: planItems.createdAt,
    })
    .from(planItems)
    .innerJoin(patients, eq(planItems.patientId, patients.id))
    .where(
      and(
        eq(planItems.status, "accepted"),
        isNull(planItems.completedVisitId),
        isNull(planItems.deletedAt),
        isNull(patients.deletedAt),
      ),
    )
    .all();

  const out: CallListRow[] = [];
  for (const r of rows) {
    if (hidden.has(r.patientId)) continue;
    const since = r.toldOn ?? r.createdAt.slice(0, 10);
    if (since > cutoff) continue;
    out.push({
      patientId: r.patientId,
      patientCode: r.patientCode,
      patientName: r.patientName,
      detail: `${r.label} · accepted since ${since}`,
      amountPaise: r.amountPaise,
      reminderHook: { kind: "incomplete", patientId: r.patientId },
    });
  }
  out.sort((a, b) => (b.amountPaise ?? 0) - (a.amountPaise ?? 0));
  return out;
}

async function listRecall(
  db: Db,
  today: string,
  recallMinMonths: number,
  recallMaxMonths: number,
): Promise<CallListRow[]> {
  const minOn = addIstDays(today, -recallMaxMonths * 30);
  const maxOn = addIstDays(today, -recallMinMonths * 30);
  const hidden = await hiddenPatientIds(db, "recall");
  const lastVisits = await db
    .select({
      patientId: visits.patientId,
      lastOn: sql<string>`max(${visits.visitDateLocal})`,
      patientCode: patients.code,
      patientName: patients.fullName,
    })
    .from(visits)
    .innerJoin(patients, eq(visits.patientId, patients.id))
    .where(and(eq(visits.status, "final"), isNull(visits.deletedAt), isNull(patients.deletedAt)))
    .groupBy(visits.patientId, patients.code, patients.fullName)
    .all();

  const out: CallListRow[] = [];
  for (const r of lastVisits) {
    if (hidden.has(r.patientId)) continue;
    const lastOn = r.lastOn;
    if (!lastOn || lastOn < minOn || lastOn > maxOn) continue;
    out.push({
      patientId: r.patientId,
      patientCode: r.patientCode,
      patientName: r.patientName,
      detail: `Last visit ${lastOn}`,
      amountPaise: null,
      reminderHook: { kind: "recall", patientId: r.patientId },
    });
  }
  out.sort((a, b) => a.detail.localeCompare(b.detail));
  return out;
}
