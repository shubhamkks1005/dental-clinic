import { financialYearOf, newUlid } from "@clinic/shared";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { auditInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError, NotFoundError } from "../errors";
import { takeNumber } from "../numbering";
import { assertAllowed } from "../permissions";
import { prescriptionItems, prescriptions } from "../schema";
import { nowUtcSql } from "../sql";
import { prescriptionsGetRepo, type PrescriptionRow } from "./prescriptions-get";

function formatRxNo(period: string, value: SQLLike): ReturnType<typeof sql<string>> {
  return sql<string>`printf('RX-%s-%04d', ${period}, ${value})`;
}

type SQLLike = ReturnType<typeof sql<number>>;

// 4.2.6 issue/revise; 4.2.7 copy last issued.
export function prescriptionsIssueRepo(db: Db, ctx: Ctx) {
  const getRepo = prescriptionsGetRepo(db, ctx);

  return {
    async issue(id: string, version: number): Promise<PrescriptionRow> {
      assertAllowed(ctx, "prescriptions.write");
      const row = await db
        .select()
        .from(prescriptions)
        .where(and(eq(prescriptions.id, id), isNull(prescriptions.deletedAt)))
        .get();
      if (!row) throw new NotFoundError("That prescription");
      if (row.status !== "draft") {
        throw new InvalidError("Only a draft prescription can be issued.");
      }
      if (row.version !== version) throw new ConflictError();

      const items = await db
        .select({ id: prescriptionItems.id })
        .from(prescriptionItems)
        .where(and(eq(prescriptionItems.prescriptionId, id), isNull(prescriptionItems.deletedAt)));
      if (items.length === 0) {
        throw new InvalidError("Add at least one medicine before issuing.");
      }

      const period = financialYearOf(new Date());
      const { bump, value } = takeNumber(db, "prescription", period, ctx.userId);
      const status = row.revisedFromId ? "revised" : "issued";
      const rxNo = formatRxNo(period, value);

      const results = await db.batch([
        bump,
        db
          .update(prescriptions)
          .set({
            status,
            rxNo,
            rxPeriod: period,
            issuedAt: nowUtcSql,
            issuedBy: ctx.userId,
            shareWithPortal: true,
            version: row.version + 1,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
          })
          .where(and(eq(prescriptions.id, id), eq(prescriptions.version, version)))
          .returning({ id: prescriptions.id }),
        auditInsert(db, ctx, {
          action: "update",
          table: "prescriptions",
          rowId: id,
          before: { status: "draft" },
          after: { status, rxPeriod: period },
        }),
      ]);
      const updated = results[1] as { id: string }[];
      if (!updated || updated.length === 0) throw new ConflictError();
      return getRepo.get(id);
    },

    async revise(id: string): Promise<PrescriptionRow> {
      assertAllowed(ctx, "prescriptions.write");
      const row = await getRepo.get(id);
      if (row.status === "draft") {
        throw new InvalidError("Issue this draft first, or edit it directly.");
      }

      const newId = newUlid();
      const itemInserts = row.items.map((item, i) =>
        db.insert(prescriptionItems).values({
          id: newUlid(),
          prescriptionId: newId,
          medicineId: item.medicineId,
          genericName: item.genericName,
          brand: item.brand,
          form: item.form,
          strength: item.strength,
          dose: item.dose,
          frequency: item.frequency,
          days: item.days,
          timing: item.timing,
          instruction: item.instruction,
          tags: item.tags,
          sortOrder: i + 1,
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
        }),
      );

      await db.batch([
        db.insert(prescriptions).values({
          id: newId,
          patientId: row.patientId,
          visitId: row.visitId,
          doctorId: ctx.userId,
          weightKg: row.weightKg,
          advice: row.advice,
          followUpOn: row.followUpOn,
          status: "draft",
          revisedFromId: row.id,
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
        }),
        ...itemInserts,
        auditInsert(db, ctx, {
          action: "create",
          table: "prescriptions",
          rowId: newId,
          before: null,
          after: { revisedFromId: row.id, status: "draft" },
        }),
      ]);

      return getRepo.get(newId);
    },

    async copyPrevious(patientId: string, visitId?: string | null): Promise<PrescriptionRow> {
      assertAllowed(ctx, "prescriptions.write");
      const prior = await db
        .select({ id: prescriptions.id })
        .from(prescriptions)
        .where(
          and(
            eq(prescriptions.patientId, patientId),
            inArray(prescriptions.status, ["issued", "revised"]),
            isNull(prescriptions.deletedAt),
          ),
        )
        .orderBy(desc(prescriptions.issuedAt), desc(prescriptions.createdAt))
        .limit(1)
        .get();
      if (!prior) throw new NotFoundError("No previous prescription");

      const source = await getRepo.get(prior.id);
      const newId = newUlid();
      const itemInserts = source.items.map((item, i) =>
        db.insert(prescriptionItems).values({
          id: newUlid(),
          prescriptionId: newId,
          medicineId: item.medicineId,
          genericName: item.genericName,
          brand: item.brand,
          form: item.form,
          strength: item.strength,
          dose: item.dose,
          frequency: item.frequency,
          days: item.days,
          timing: item.timing,
          instruction: item.instruction,
          tags: item.tags,
          sortOrder: i + 1,
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
        }),
      );

      await db.batch([
        db.insert(prescriptions).values({
          id: newId,
          patientId,
          visitId: visitId ?? source.visitId,
          doctorId: ctx.userId,
          weightKg: source.weightKg,
          advice: source.advice,
          followUpOn: null,
          status: "draft",
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
        }),
        ...itemInserts,
        auditInsert(db, ctx, {
          action: "create",
          table: "prescriptions",
          rowId: newId,
          before: null,
          after: { copiedFromId: source.id, status: "draft" },
        }),
      ]);

      return getRepo.get(newId);
    },

    async listForVisit(visitId: string): Promise<PrescriptionRow[]> {
      assertAllowed(ctx, "prescriptions.write");
      const rows = await db
        .select({ id: prescriptions.id })
        .from(prescriptions)
        .where(and(eq(prescriptions.visitId, visitId), isNull(prescriptions.deletedAt)))
        .orderBy(desc(prescriptions.createdAt));
      const out: PrescriptionRow[] = [];
      for (const r of rows) out.push(await getRepo.get(r.id));
      return out;
    },

    async listForPatient(patientId: string): Promise<PrescriptionRow[]> {
      assertAllowed(ctx, "prescriptions.write");
      const rows = await db
        .select({ id: prescriptions.id })
        .from(prescriptions)
        .where(and(eq(prescriptions.patientId, patientId), isNull(prescriptions.deletedAt)))
        .orderBy(desc(prescriptions.createdAt), asc(prescriptions.id));
      const out: PrescriptionRow[] = [];
      for (const r of rows) out.push(await getRepo.get(r.id));
      return out;
    },
  };
}
