import { newUlid, type MedicalHistoryItem, type SaveMedicalHistoryInput } from "@clinic/shared";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { auditInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { alerts, medicalHistory, patients } from "../schema";
import { nowUtcSql } from "../sql";

export type MedicalHistoryVersion = {
  id: string;
  patientId: string;
  versionNo: number;
  items: MedicalHistoryItem[];
  recordedAt: string;
  recordedBy: string;
};

export type AlertRow = {
  id: string;
  code: string;
  label: string;
  restricted: boolean;
  active: boolean;
};

// 3.2.4: append a new medical_history version; rebuild active alerts from "yes" answers.
export function medicalHistoryRepo(db: Db, ctx: Ctx) {
  return {
    async latest(patientId: string): Promise<MedicalHistoryVersion | null> {
      assertAllowed(ctx, "clinical.view");
      const row = await db
        .select()
        .from(medicalHistory)
        .where(and(eq(medicalHistory.patientId, patientId), isNull(medicalHistory.deletedAt)))
        .orderBy(desc(medicalHistory.versionNo))
        .get();
      if (!row) return null;
      return {
        id: row.id,
        patientId: row.patientId,
        versionNo: row.versionNo,
        items: JSON.parse(row.answersJson) as MedicalHistoryItem[],
        recordedAt: row.recordedAt,
        recordedBy: row.recordedBy,
      };
    },

    async save(input: SaveMedicalHistoryInput): Promise<MedicalHistoryVersion> {
      assertAllowed(ctx, "clinical.edit");
      const patient = await db
        .select({ id: patients.id })
        .from(patients)
        .where(and(eq(patients.id, input.patientId), isNull(patients.deletedAt)))
        .get();
      if (!patient) throw new NotFoundError("That patient");

      const prev = await db
        .select({ versionNo: medicalHistory.versionNo, answersJson: medicalHistory.answersJson })
        .from(medicalHistory)
        .where(and(eq(medicalHistory.patientId, input.patientId), isNull(medicalHistory.deletedAt)))
        .orderBy(desc(medicalHistory.versionNo))
        .get();
      const versionNo = (prev?.versionNo ?? 0) + 1;
      const id = newUlid();
      const recordedAt = new Date().toISOString();
      const answersJson = JSON.stringify(input.items);

      // Deactivate previous alerts, then insert fresh ones for "yes" answers with alertLabel.
      const oldAlerts = await db
        .select({ id: alerts.id, version: alerts.version })
        .from(alerts)
        .where(
          and(
            eq(alerts.patientId, input.patientId),
            eq(alerts.active, true),
            isNull(alerts.deletedAt),
          ),
        );

      const deactivate = oldAlerts.map((a) =>
        db
          .update(alerts)
          .set({
            active: false,
            updatedBy: ctx.userId,
            updatedAt: nowUtcSql,
            version: a.version + 1,
          })
          .where(and(eq(alerts.id, a.id), eq(alerts.version, a.version))),
      );

      const newAlerts = input.items
        .filter((item) => item.answer === "yes" && item.alertLabel?.trim())
        .map((item) =>
          db.insert(alerts).values({
            id: newUlid(),
            patientId: input.patientId,
            code: item.code,
            label: item.alertLabel!.trim(),
            restricted: item.restricted ?? false,
            active: true,
            sourceHistoryId: id,
            createdBy: ctx.userId,
            updatedBy: ctx.userId,
          }),
        );

      await db.batch([
        db.insert(medicalHistory).values({
          id,
          patientId: input.patientId,
          versionNo,
          answersJson,
          recordedAt,
          recordedBy: ctx.userId,
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
        }),
        auditInsert(db, ctx, {
          action: "create",
          table: "medical_history",
          rowId: id,
          before: prev ? { versionNo: prev.versionNo } : undefined,
          after: { versionNo, itemCount: input.items.length },
        }),
        ...deactivate,
        ...newAlerts,
      ]);

      return {
        id,
        patientId: input.patientId,
        versionNo,
        items: input.items,
        recordedAt,
        recordedBy: ctx.userId,
      };
    },

    async listAlerts(patientId: string): Promise<AlertRow[]> {
      assertAllowed(ctx, "clinical.view");
      const rows = await db
        .select({
          id: alerts.id,
          code: alerts.code,
          label: alerts.label,
          restricted: alerts.restricted,
          active: alerts.active,
        })
        .from(alerts)
        .where(
          and(eq(alerts.patientId, patientId), eq(alerts.active, true), isNull(alerts.deletedAt)),
        );
      return rows;
    },

    /** Receptionist: only whether a restricted or any alert exists — no clinical labels. */
    async alertFlags(patientId: string): Promise<{ hasAlert: boolean; hasRestricted: boolean }> {
      assertAllowed(ctx, "clinical.alert_flag");
      const rows = await db
        .select({ restricted: alerts.restricted })
        .from(alerts)
        .where(
          and(eq(alerts.patientId, patientId), eq(alerts.active, true), isNull(alerts.deletedAt)),
        );
      return {
        hasAlert: rows.length > 0,
        hasRestricted: rows.some((r) => r.restricted),
      };
    },

    /** Day list / cards: flags only, never labels (3.3.2). Empty map when no ids. */
    async alertFlagsForPatients(
      patientIds: string[],
    ): Promise<Map<string, { hasAlert: boolean; hasRestricted: boolean }>> {
      assertAllowed(ctx, "clinical.alert_flag");
      const out = new Map<string, { hasAlert: boolean; hasRestricted: boolean }>();
      const unique = [...new Set(patientIds.filter(Boolean))];
      for (const id of unique) out.set(id, { hasAlert: false, hasRestricted: false });
      if (unique.length === 0) return out;

      const rows = await db
        .select({ patientId: alerts.patientId, restricted: alerts.restricted })
        .from(alerts)
        .where(
          and(inArray(alerts.patientId, unique), eq(alerts.active, true), isNull(alerts.deletedAt)),
        );

      for (const row of rows) {
        const cur = out.get(row.patientId);
        if (!cur) continue;
        cur.hasAlert = true;
        if (row.restricted) cur.hasRestricted = true;
      }
      return out;
    },
  };
}
