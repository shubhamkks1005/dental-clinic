import { sql } from "drizzle-orm";
import { check, index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { oneOf, standardColumns } from "./columns";

export const OUTREACH_LIST_KINDS = ["incomplete", "recall"] as const;

/** 6.3.7: contact notes that hide a patient from a call list until they return. */
export const outreachContacts = sqliteTable(
  "outreach_contacts",
  {
    ...standardColumns(),
    patientId: text("patient_id").notNull(),
    listKind: text("list_kind", { enum: OUTREACH_LIST_KINDS }).notNull(),
    note: text("note").notNull(),
    contactedOn: text("contacted_on").notNull(),
  },
  (t) => [
    index("outreach_contacts_patient_kind_idx").on(t.patientId, t.listKind, t.contactedOn),
    check("outreach_contacts_list_kind_check", oneOf(t.listKind.name, OUTREACH_LIST_KINDS)),
    check(
      "outreach_contacts_contacted_on_format",
      sql.raw(`"contacted_on" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`),
    ),
  ],
);
