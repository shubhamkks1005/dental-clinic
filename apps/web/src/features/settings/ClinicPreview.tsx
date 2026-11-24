import { useEffect, useState } from "react";
import { PrintLayout } from "../../ui/print";
import { clinicHeaderFromSettings } from "../print/clinic-header";
import { getSetting } from "./api";
import "../print/prescription.css";

// Live Prescription preview next to the Clinic and doctor form (Settings.dc.html). It is the real
// letterhead builder and the real header band, fed with what is typed, so what the doctor sees is
// what prints. The body is a fake sample line, never patient data.
export function ClinicPreview({ draft }: { draft: Record<string, string> }) {
  const [timings, setTimings] = useState<unknown>(null);
  useEffect(() => {
    getSetting<unknown>("clinic.timings")
      .then((r) => setTimings(r.value))
      .catch(() => setTimings(null));
  }, []);

  const rows = [
    ...Object.entries(draft).map(([key, value]) => ({ key, value })),
    { key: "clinic.timings", value: timings },
  ];
  const clinic = clinicHeaderFromSettings(rows);
  if (!clinic.registrationNo.trim()) clinic.registrationNo = "missing";

  return (
    <aside className="clinic-preview" aria-label="Prescription preview">
      <h3 className="rx-label">Prescription preview</h3>
      <div className="clinic-preview-sheet">
        <PrintLayout size="A5" header="print" clinic={clinic}>
          <p className="rx-mark">Rx</p>
          <p className="small muted">Sample medicine, 1-0-1, 3 days</p>
        </PrintLayout>
      </div>
      <p className="small muted">
        Changes show on new prints. Old prescriptions and bills stay as issued.
      </p>
    </aside>
  );
}
