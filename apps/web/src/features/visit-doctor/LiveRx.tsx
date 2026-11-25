import { useEffect, useRef, useState } from "react";
import { api } from "../../api/client";
import { PrintLayout } from "../../ui/print";
import { clinicHeaderFromSettings } from "../print/clinic-header";
import { PrescriptionBody, rxItemNote } from "../print/PrescriptionBody";
import { PrescriptionFooter } from "../print/PrescriptionSample";
import type { RxSnapshot } from "../prescriptions";
import { getQrImage } from "../settings/api";
import { problemTeeth } from "./rx-model";

// A5 is 148 mm wide: 559 px at 96 dpi.
const A5_PX = 559;

/** Scale that fits the printed sheet into the side pane (never above real size). */
function useFitScale() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setScale(Math.min(1, el.clientWidth / A5_PX)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, scale };
}

type Props = {
  snapshot: RxSnapshot | null;
  patient: { fullName: string; code: string; ageGender: string };
  lines: { label: string; toothFdi: number | null }[];
  onIssue: () => void;
};

/**
 * The live sheet (design: "Live A4 Rx"). It is the print layout of the real prescription
 * (PrintLayout + PrescriptionBody, the same pieces as PrintPrescriptionScreen), so the preview
 * and the paper cannot differ. Clinic and doctor details come from Settings, never typed here.
 */
export function LiveRx({ snapshot, patient, lines, onIssue }: Props) {
  const [clinic, setClinic] = useState(clinicHeaderFromSettings([]));
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => {
    getQrImage()
      .then((r) => setQr(r.value))
      .catch(() => setQr(null));
  }, []);
  useEffect(() => {
    let live = true;
    api<{ settings: Array<{ key: string; value: unknown }> }>("/api/staff/settings")
      .then((r) => live && setClinic(clinicHeaderFromSettings(r.settings)))
      .catch(() => live && setClinic(clinicHeaderFromSettings([])));
    return () => {
      live = false;
    };
  }, []);

  const fit = useFitScale();
  const draft = !snapshot || snapshot.status !== "issued";
  const badge = draft ? "DRAFT" : (snapshot?.rxNo ?? "ISSUED");

  return (
    <div className="vd-rx">
      <div className="vd-rx-top">
        <span className="vd-hint">Live preview of the prescription</span>
        <button type="button" className="vd-primary-btn" onClick={onIssue}>
          Issue Rx
        </button>
      </div>
      <div className="vd-sheet" aria-label="Prescription sheet">
        <div className="vd-sheet-bar">
          <span className={`vd-pill ${draft ? "vd-pill-error" : "vd-pill-success"}`}>{badge}</span>
          <span className="vd-hint">{patient.ageGender}</span>
        </div>
        <div className="vd-sheet-scroll" ref={fit.ref}>
          <div style={{ zoom: fit.scale }}>
            <PrintLayout
              size="A5"
              header="print"
              clinic={clinic}
              footer={<PrescriptionFooter doctorName={clinic.doctorName} qr={qr} />}
            >
              <PrescriptionBody
                data={{
                  patientName: patient.fullName,
                  patientCode: patient.code,
                  rxNo: snapshot?.rxNo ?? null,
                  items: (snapshot?.lines ?? []).map((m) => ({
                    key: m.key,
                    name: m.genericName,
                    note: rxItemNote(m),
                    dose: m.dose,
                    frequency: m.frequency,
                    days: m.days,
                  })),
                  advice: snapshot?.advice ?? "",
                  followUpOn: snapshot?.followUpOn ?? "",
                  problemTeeth: problemTeeth(lines),
                }}
              />
            </PrintLayout>
          </div>
        </div>
      </div>
    </div>
  );
}
