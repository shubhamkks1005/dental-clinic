import { doctorShortName, type Doctor } from "@clinic/shared";
import type { Ref } from "react";
import { NativeInput, Textarea } from "../../../ui/form";
import { doctorVars } from "../../../ui/DoctorBadge";
import { PatientPick } from "./PatientPick";
import { TimeAdjuster } from "./TimeAdjuster";
import type { BookDraft } from "./useBookDraft";

// Panel 0 "Slot Selection" (HTML 547-646): patient, Assign Doctor, visit chips, time adjuster,
// reason; then the server's answer (role=alert) with "Book anyway" for a soft rule (P5.7.9).
export function SlotPanel({
  d,
  doctors,
  doctorLocked,
  move,
  boxHidden,
  boxRef,
  searchRef,
  onNew,
  onReload,
}: {
  d: BookDraft;
  doctors: Doctor[];
  doctorLocked: boolean;
  move: boolean;
  boxHidden: boolean;
  boxRef: Ref<HTMLDivElement>;
  searchRef: Ref<HTMLInputElement>;
  onNew: () => void;
  onReload: () => void;
}) {
  const shown = doctorLocked ? doctors.filter((x) => x.id === d.doctorId) : doctors;
  return (
    <>
      <PatientPick
        patient={d.patient}
        locked={move}
        hidden={boxHidden}
        boxRef={boxRef}
        searchRef={searchRef}
        onPick={d.setPatient}
        onNew={move ? null : onNew}
      />
      <fieldset className="bk-field bk-fieldset">
        <legend className="bk-label">
          Assign Doctor <span className="bk-req">*</span>
        </legend>
        <div className="bk-doctors">
          {shown.map((doc) => (
            <label
              key={doc.id}
              className={`bk-doctor${d.doctorId === doc.id ? " is-on" : ""}`}
              style={doctorVars(doc)}
            >
              <NativeInput
                type="radio"
                name="bk-doctor"
                className="sr-only"
                value={doc.id}
                checked={d.doctorId === doc.id}
                disabled={doctorLocked}
                onChange={() => d.setDoctorId(doc.id)}
              />
              <span className="cal-dot bk-doctor-dot" aria-hidden="true" />
              <span className="bk-doctor-name">{doctorShortName(doc.name)}</span>
            </label>
          ))}
          {shown.length === 0 ? (
            <p className="bk-hint">No active doctor. Add one in Settings &gt; Staff.</p>
          ) : null}
        </div>
      </fieldset>
      <div className="bk-field">
        <span className="bk-label">Visit Type &amp; Procedure Preset</span>
        <div className="bk-chips" role="group" aria-label="Visit type">
          {d.visitTypes.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`bk-chip${d.visit?.id === v.id ? " is-on" : ""}`}
              aria-pressed={d.visit?.id === v.id}
              disabled={move}
              onClick={() => d.chooseVisit(v.id)}
            >
              {v.label} ({Number(v.data.minutes ?? 0)}m)
            </button>
          ))}
        </div>
      </div>
      <TimeAdjuster
        dateLocal={d.dateLocal}
        time={d.time}
        startMin={d.startMin}
        minutes={d.minutes}
        onDate={d.setDateLocal}
        onTime={d.setTime}
        onMinutes={d.setMinutes}
      />
      {move ? null : (
        <label className="bk-field">
          <span className="bk-label">Reason for visit / Chief complaint (Optional)</span>
          <Textarea
            className="bk-input bk-textarea"
            rows={2}
            maxLength={500}
            placeholder="e.g. Regular orthodontics checkup, composite filling review..."
            value={d.note}
            onChange={(e) => d.setNote(e.target.value)}
          />
        </label>
      )}
      {d.error ? (
        <div className="bk-error" role="alert">
          <p>{d.error}</p>
          {d.softRule ? (
            <button type="button" className="bk-text-link" onClick={() => d.setOverride("")}>
              Book anyway
            </button>
          ) : null}
          {d.conflict ? (
            <button type="button" className="bk-text-link" onClick={onReload}>
              Reload
            </button>
          ) : null}
        </div>
      ) : null}
      {d.override !== null ? (
        <label className="bk-field bk-override">
          <span className="bk-label">Reason to book anyway (saved in the log)</span>
          <NativeInput
            className="bk-input"
            maxLength={200}
            autoFocus
            placeholder="For example: emergency, doctor agreed"
            value={d.override}
            onChange={(e) => d.setOverride(e.target.value)}
          />
        </label>
      ) : null}
    </>
  );
}
