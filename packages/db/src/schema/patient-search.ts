import { SEARCH_TOKEN_KINDS } from "@clinic/shared";
import { check, index, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { oneOf, standardColumns } from "./columns";

// 2.1.6: denormalised search tokens. Rebuilt in the same batch as the patient write.
// Tokens are stored lowercase; queries use token >= prefix AND token < tokenRangeEnd(prefix).
export const patientSearch = sqliteTable(
  "patient_search",
  {
    ...standardColumns(),
    patientId: text("patient_id").notNull(),
    token: text("token").notNull(),
    kind: text("kind", { enum: SEARCH_TOKEN_KINDS }).notNull(),
  },
  (t) => [
    unique("patient_search_patient_token_kind").on(t.patientId, t.token, t.kind),
    index("patient_search_token_idx").on(t.token),
    index("patient_search_patient_id_idx").on(t.patientId),
    check("patient_search_kind_check", oneOf(t.kind.name, SEARCH_TOKEN_KINDS)),
  ],
);
