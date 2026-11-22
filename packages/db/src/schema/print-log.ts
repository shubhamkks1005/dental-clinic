import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { standardColumns } from "./columns";

/** 4.3.5 every print/reprint of Rx, certificate, estimate, consent, etc. */
export const printLog = sqliteTable(
  "print_log",
  {
    ...standardColumns(),
    documentKind: text("document_kind").notNull(),
    documentId: text("document_id").notNull(),
    documentVersion: integer("document_version"),
    copies: integer("copies").notNull().default(1),
    isReprint: integer("is_reprint", { mode: "boolean" }).notNull().default(false),
    printedAt: text("printed_at").notNull(),
    printedBy: text("printed_by").notNull(),
  },
  (t) => [
    index("print_log_doc_idx").on(t.documentKind, t.documentId, t.printedAt),
    check("print_log_copies_positive", sql.raw(`"copies" >= 1`)),
    check("print_log_reprint_bool", sql.raw(`"is_reprint" IN (0, 1)`)),
  ],
);
