import { formatDisplayDate, istDate } from "@clinic/shared";
import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { clinicHeaderFromSettings } from "../print/clinic-header";
import type { RxSnapshot } from "../prescriptions";
import { getQrImage } from "../settings/api";
import type { Affected } from "./chart-model";
import { daysWord, totalApprox } from "./rx-model";
import { ToothMini } from "./ToothMini";

type Props = {
  snapshot: RxSnapshot | null;
  patient: { fullName: string; code: string; ageGender: string };
  visitDate: string;
  teeth: Affected[];
  /** conditionCode → colour from the conditions list. */
  colorOf: (code: string) => string | undefined;
};

const TIMING_WORD: Record<string, string> = {
  after_food: "After food",
  before_food: "Before food",
  bedtime: "At bedtime",
  anytime: "Anytime",
};

/**
 * The live sheet (design: "Live A4 Rx"): the clinic letterhead, the patient, the problem teeth,
 * the medicines, the advice and the timings. Clinic and doctor words come from Settings.
 */
export function LiveRx({ snapshot, patient, visitDate, teeth, colorOf }: Props) {
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

  const draft = !snapshot || snapshot.status !== "issued";
  const badge = draft ? "DRAFT" : (snapshot?.rxNo ?? "ISSUED");
  const meds = snapshot?.lines ?? [];

  return (
    <div className="vd-sheet" aria-label="Prescription sheet">
      <div className="vd-sheet-head">
        <div className="vd-sheet-clinic">
          {clinic.logo && <img className="vd-sheet-logo" src={clinic.logo} alt="" />}
          <span className="vd-sheet-name">{clinic.name}</span>
          {clinic.tagline && <span className="vd-sheet-tag">{clinic.tagline}</span>}
          {clinic.kind && <span className="vd-sheet-kind">{clinic.kind}</span>}
          <span className="vd-sheet-contact">
            {clinic.phone && (
              <span>
                <span className="vd-icon">call</span>Phone : {clinic.phone}
              </span>
            )}
            {clinic.email && (
              <span>
                <span className="vd-icon">mail</span>
                {clinic.email}
              </span>
            )}
          </span>
        </div>
        <div className="vd-sheet-doctor">
          <span className={`vd-sheet-badge ${draft ? "is-draft" : "is-issued"}`}>{badge}</span>
          <strong className="vd-sheet-dr">{clinic.doctorName}</strong>
          {clinic.qualifications && <span className="vd-sheet-q">{clinic.qualifications}</span>}
          {clinic.speciality && <span className="vd-sheet-s">{clinic.speciality}</span>}
          {clinic.extraLine && <span className="vd-sheet-x">{clinic.extraLine}</span>}
          {clinic.registrationNo && (
            <span className="vd-sheet-reg">Reg.No- {clinic.registrationNo}</span>
          )}
        </div>
      </div>

      <div className="vd-sheet-body">
        <div className="vd-sheet-patient">
          <p>
            <strong>{patient.fullName}</strong> · {patient.ageGender} · {patient.code}
          </p>
          <span>{formatDisplayDate(visitDate || istDate(new Date()))}</span>
        </div>
        {teeth.length > 0 && (
          <div className="vd-sheet-teeth">
            <strong>Problem Teeth (only affected teeth printed):</strong>
            <div className="vd-sheet-strip">
              {teeth.map((t) => (
                <ToothMini key={t.fdi} fdi={t.fdi} parts={t.parts} colorOf={colorOf} />
              ))}
            </div>
            <div className="vd-sheet-lines">
              {teeth.map((t) => (
                <span key={t.fdi}>
                  <strong>{t.fdi}</strong> ·{" "}
                  {t.parts
                    .map((p) =>
                      p.surface === "whole" ? p.label : `${p.surface.toUpperCase()} ${p.label}`,
                    )
                    .join(" · ")}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="vd-sheet-meds">
          {meds.length === 0 ? (
            <span className="vd-sheet-none">No medicines yet.</span>
          ) : (
            meds.map((m, i) => {
              const name = `${m.genericName}${m.strength ? ` ${m.strength}` : ""}${m.form ? ` ${m.form}` : ""}`;
              const total = totalApprox(m.frequency, m.days);
              return (
                <p key={m.key}>
                  <span className="vd-sheet-rx">℞</span>
                  {i + 1}. <strong>{name}</strong>
                  {m.brand ? ` (${m.brand})` : ""} — {m.frequency} · {daysWord(m.days)}
                  {m.timing ? ` (${TIMING_WORD[m.timing] ?? m.timing})` : ""}
                  {total ? ` · Total: ${total} approx.` : ""}
                  {m.instruction && <em> · {m.instruction}</em>}
                </p>
              );
            })
          )}
        </div>
        {(snapshot?.advice || snapshot?.followUpOn) && (
          <div className="vd-sheet-advice">
            {snapshot.advice && (
              <p>
                <strong>Advice:</strong> {snapshot.advice}
              </p>
            )}
            {snapshot.followUpOn && (
              <p className="vd-sheet-follow">Follow-up: {formatDisplayDate(snapshot.followUpOn)}</p>
            )}
          </div>
        )}
      </div>

      <div className="vd-sheet-foot">
        <div className="vd-sheet-times">
          {clinic.timingsLines.length > 0 && <strong>Consultation Timings</strong>}
          {clinic.timingsLines.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
        <div className="vd-sheet-where">
          {clinic.address && (
            <span className="vd-sheet-addr">
              <span className="vd-icon">location_on</span>
              {clinic.address}
            </span>
          )}
          {(qr || clinic.instagram) && (
            <span className="vd-sheet-qr">
              {qr && <img src={qr} alt="QR" width={32} height={32} />}
              {clinic.instagram && <span>{clinic.instagram}</span>}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
