import {
  newUlid,
  type ConsentMethod,
  type ConsentRow,
  type ConsentType,
  CONSENT_METHODS,
  CONSENT_TYPES,
} from "@clinic/shared";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { auditInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { consents, patients, users } from "../schema";

export type NewConsent = {
  type: ConsentType;
  noticeVersion: number;
  given: boolean;
  method: ConsentMethod;
  /** UTC ISO; defaults to now in the Worker. */
  givenAt: string;
  visitId?: string | null;
  planItemId?: string | null;
  templateKey?: string | null;
  templateVersion?: number | null;
  explainedBy?: string | null;
};

// 2.1.9: append-only consent history per patient. Withdraw = new row with given=false.
export function consentsRepo(db: Db, ctx: Ctx) {
  return {
    async listForPatient(patientId: string): Promise<ConsentRow[]> {
      assertAllowed(ctx, "patients.view");
      await requirePatient(patientId);
      const rows = await db
        .select({
          id: consents.id,
          patientId: consents.patientId,
          type: consents.type,
          noticeVersion: consents.noticeVersion,
          given: consents.given,
          givenAt: consents.givenAt,
          recordedBy: consents.recordedBy,
          recordedByName: users.name,
          method: consents.method,
          createdAt: consents.createdAt,
          visitId: consents.visitId,
          planItemId: consents.planItemId,
          templateKey: consents.templateKey,
          templateVersion: consents.templateVersion,
          explainedBy: consents.explainedBy,
        })
        .from(consents)
        .leftJoin(users, eq(users.id, consents.recordedBy))
        .where(and(eq(consents.patientId, patientId), isNull(consents.deletedAt)))
        .orderBy(desc(consents.givenAt), asc(consents.type))
        .all();
      return rows.map((r) => ({
        ...r,
        type: r.type as ConsentType,
        method: r.method as ConsentMethod,
        recordedByName: r.recordedByName ?? null,
      }));
    },

    async record(patientId: string, input: NewConsent): Promise<ConsentRow[]> {
      assertAllowed(ctx, "patients.edit");
      await requirePatient(patientId);
      if (!CONSENT_TYPES.includes(input.type)) throw new InvalidError("Unknown consent type.");
      if (!CONSENT_METHODS.includes(input.method)) {
        throw new InvalidError("Unknown consent method.");
      }
      if (!Number.isInteger(input.noticeVersion) || input.noticeVersion < 1) {
        throw new InvalidError("Notice version must be a positive whole number.");
      }
      const id = newUlid();
      await db.batch([
        db.insert(consents).values({
          id,
          patientId,
          type: input.type,
          noticeVersion: input.noticeVersion,
          given: input.given,
          givenAt: input.givenAt,
          recordedBy: ctx.userId,
          method: input.method,
          visitId: input.visitId ?? null,
          planItemId: input.planItemId ?? null,
          templateKey: input.templateKey ?? null,
          templateVersion: input.templateVersion ?? null,
          explainedBy: input.explainedBy ?? null,
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
        }),
        auditInsert(db, ctx, {
          action: "create",
          table: "consents",
          rowId: id,
          after: {
            patientId,
            type: input.type,
            noticeVersion: input.noticeVersion,
            given: input.given,
            method: input.method,
            templateKey: input.templateKey ?? null,
          },
        }),
      ]);
      return this.listForPatient(patientId);
    },
  };

  async function requirePatient(patientId: string) {
    const row = await db
      .select({ id: patients.id })
      .from(patients)
      .where(and(eq(patients.id, patientId), isNull(patients.deletedAt)))
      .get();
    if (!row) throw new NotFoundError("This patient");
  }
}
