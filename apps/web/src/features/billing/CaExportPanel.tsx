import { useState } from "react";
import { useMe } from "../auth/RequireStaff";
import { downloadBillsExport } from "./api";
import { TextInput } from "../../ui/form";

/** 5.3.12 doctor-only monthly CSV for the accountant. */
export function CaExportPanel() {
  const me = useMe();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!me.permissions.includes("reports.full")) return null;

  async function onDownload() {
    setBusy(true);
    setError(null);
    try {
      const { csv, month: m } = await downloadBillsExport(month);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `billing-export-${m}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not export.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="stack gap-sm surface card-pad" aria-label="CA monthly export">
      <h2 className="title-sm">Monthly export (CA)</h2>
      <p className="muted small">
        Patient code only — no names. DRAFT — accountant to confirm columns.
      </p>
      {error ? <p className="error-text">{error}</p> : null}
      <div className="row wrap gap-sm align-center">
        <label className="stack gap-xs">
          <span className="muted small">Month</span>
          <TextInput
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{ minHeight: 44 }}
          />
        </label>
        <button
          type="button"
          className="btn"
          disabled={busy}
          onClick={() => void onDownload()}
          style={{ alignSelf: "end" }}
        >
          Download CSV
        </button>
      </div>
    </section>
  );
}
