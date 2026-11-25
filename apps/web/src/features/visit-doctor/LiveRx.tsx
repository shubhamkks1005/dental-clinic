import {
  formatDisplayDate,
  istDate,
  MEDICINE_TIMING_LABEL,
  type MedicineTiming,
} from "@clinic/shared";
import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { ClinicHeader } from "../../ui/print";
import { clinicHeaderFromSettings } from "../print/clinic-header";
import { getQrImage } from "../settings/api";
import type { RxSnapshot } from "../prescriptions";
import { medicineTitle, problemTeeth } from "./rx-model";

type Props = {
  snapshot: RxSnapshot | null;
  patient: { fullName: string; code: string; ageGender: string };
  visitDate: string;
  lines: { label: string; toothFdi: number | null }[];
  onIssue: () => void;
};

/**
 * The live sheet (design: "Live A4 Rx"). It shows the same prescription the doctor writes in
 * Accordion 3, with the clinic and doctor details from Settings (never typed here).
 */
export function LiveRx({ snapshot, patient, visitDate, lines, onIssue }: Props) {
  const [clinic, setClinic] = useState<ClinicHeader | null>(null);
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

  const teeth = problemTeeth(lines);
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
        <div className="vd-sheet-head">
          <div className="vd-sheet-clinic">
            <strong>{clinic?.name ?? "Clinic"}</strong>
            {clinic?.tagline && <em>{clinic.tagline}</em>}
            {clinic?.kind && <span>{clinic.kind}</span>}
            {clinic?.phone && <span>Phone : {clinic.phone}</span>}
            {clinic?.email && <span>{clinic.email}</span>}
          </div>
          <div className="vd-sheet-doctor">
            <span className={`vd-pill ${draft ? "vd-pill-error" : "vd-pill-success"}`}>
              {badge}
            </span>
            <strong>{clinic?.doctorName}</strong>
            {clinic?.qualifications && <span>{clinic.qualifications}</span>}
            {clinic?.speciality && <span>{clinic.speciality}</span>}
            {clinic?.extraLine && <span>{clinic.extraLine}</span>}
            {clinic?.registrationNo && <span>Reg.No- {clinic.registrationNo}</span>}
          </div>
        </div>

        <div className="vd-sheet-body">
          <p className="vd-sheet-patient">
            <strong>{patient.fullName}</strong> · {patient.ageGender} · {patient.code}
            <span>{formatDisplayDate(visitDate || istDate(new Date()))}</span>
          </p>
          {teeth.length > 0 && (
            <div>
              <strong>Problem teeth</strong>
              <div className="vd-sheet-teeth">
                {teeth.map((t) => (
                  <span key={t.fdi} className="vd-chip">
                    {t.fdi}
                  </span>
                ))}
              </div>
              <ul className="vd-sheet-list">
                {teeth.map((t) => (
                  <li key={t.fdi}>
                    {t.fdi}: {t.items.join(", ")}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="vd-sheet-meds">
            {!snapshot || snapshot.lines.length === 0 ? (
              <span className="vd-hint">No medicines yet.</span>
            ) : (
              snapshot.lines.map((m, i) => (
                <p key={m.key}>
                  <strong>
                    {i + 1}. {medicineTitle(m)}
                  </strong>
                  <br />
                  <span className="vd-hint">
                    {m.frequency} · {m.days}
                    {m.timing
                      ? ` · ${MEDICINE_TIMING_LABEL[m.timing as MedicineTiming] ?? m.timing}`
                      : ""}
                    {m.instruction ? ` · ${m.instruction}` : ""}
                  </span>
                </p>
              ))
            )}
          </div>
          {snapshot?.advice && (
            <p>
              <strong>Advice:</strong> {snapshot.advice}
            </p>
          )}
          {snapshot?.followUpOn && (
            <p className="vd-hint">Follow-up: {formatDisplayDate(snapshot.followUpOn)}</p>
          )}
        </div>

        {qr && <img className="vd-sheet-qr" src={qr} alt="QR" width={56} height={56} />}
        {clinic && clinic.timingsLines.length > 0 && (
          <div className="vd-sheet-foot">
            <strong>Consultation Timings</strong>
            {clinic.timingsLines.map((t) => (
              <span key={t}>{t}</span>
            ))}
            {clinic.address && <span>{clinic.address}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
