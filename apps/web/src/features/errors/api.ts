import type { ErrorLogEntry } from "@clinic/shared";
import { api } from "../../api/client";

export type ErrorLogRow = ErrorLogEntry;
export const getErrors = () =>
  api<{ errors: ErrorLogRow[] }>("/api/staff/errors").then((r) => r.errors);
