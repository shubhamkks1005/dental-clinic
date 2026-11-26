import { durationMinSchema, type ListItem } from "@clinic/shared";
import { useEffect, useState } from "react";
import { ApiError } from "../../../api/client";
import { getList } from "../../lists";
import { getPatient } from "../../patients";
import { bookAppointment, rescheduleAppointment, type DayAppointment } from "../api";

export type PickedPatient = { id: string; code: string; fullName: string; mobile: string | null };

/** What opened the popover: a cell (anchor), the header button (no anchor), or Reschedule. */
export type BookRequest = {
  mode: "book" | "move";
  anchor: HTMLElement | null;
  side: "left" | "right" | "auto";
  dateLocal: string;
  startMin: number;
  patientId?: string;
  patient?: PickedPatient | null;
  visitTypeId?: string;
  doctorId?: string;
  durationMin?: number;
  move?: { id: string; version: number };
};

const toHHMM = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const fromHHMM = (v: string) => {
  const m = /^(\d{2}):(\d{2})$/.exec(v);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
const SOFT_RULE = /override with a reason\.$/;

export type BookDraft = ReturnType<typeof useBookDraft>;

// Popover form state and the one submit (P5.7). Nothing is optimistic: the server decides the
// doctor, length bounds, soft rules (past, closed, lunch, 90 days, leave) and repeats.
export function useBookDraft(
  req: BookRequest,
  me: { id: string; role: string },
  onlyDoctor: string | null,
) {
  const [patient, setPatient] = useState<PickedPatient | null>(req.patient ?? null);
  const [visitTypes, setVisitTypes] = useState<ListItem[]>([]);
  const [visitTypeId, setVisitTypeId] = useState(req.visitTypeId ?? "");
  const [minutes, setMinutes] = useState(req.durationMin ?? 30);
  const [dateLocal, setDateLocal] = useState(req.dateLocal);
  const [time, setTime] = useState(toHHMM(req.startMin));
  const [doctorId, setDoctorId] = useState(
    me.role === "doctor" ? me.id : (req.doctorId ?? onlyDoctor ?? ""),
  );
  const [note, setNote] = useState("");
  const [override, setOverride] = useState<string | null>(null);
  const [softRule, setSoftRule] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    getList("visit_types")
      .then((items) => {
        const active = items.filter((i) => i.active);
        setVisitTypes(active);
        // HTML 578: the first chip starts chosen; its minutes give the length unless one was asked.
        setVisitTypeId((cur) => {
          const chosen = active.find((v) => v.id === cur) ?? active[0];
          if (chosen && req.durationMin === undefined)
            setMinutes(Number(chosen.data.minutes ?? 30));
          return chosen?.id ?? "";
        });
      })
      .catch(() => setVisitTypes([]));
    if (!req.patient && req.patientId) {
      getPatient(req.patientId)
        .then((p) => setPatient({ id: p.id, code: p.code, fullName: p.fullName, mobile: p.mobile }))
        .catch(() => setPatient(null));
    }
    // Loaded once per open; the request object is fixed while the popover is open.
  }, []);

  useEffect(() => {
    if (onlyDoctor && !doctorId) setDoctorId(onlyDoctor);
  }, [onlyDoctor, doctorId]);

  const touch =
    <T>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setDirty(true);
      setError(null);
      setSoftRule(false);
      setConflict(false);
    };
  const visit = visitTypes.find((v) => v.id === visitTypeId) ?? null;
  const startMin = fromHHMM(time);

  function chooseVisit(id: string) {
    const v = visitTypes.find((x) => x.id === id);
    touch(setVisitTypeId)(id);
    if (v) setMinutes(Number(v.data.minutes ?? minutes));
  }

  function whyNot(): string | null {
    if (!patient) return "Choose a patient.";
    if (!doctorId) return "Choose a doctor.";
    if (!visitTypeId) return "Choose a visit type.";
    if (startMin === null) return "Choose a start time.";
    const d = durationMinSchema.safeParse(minutes);
    if (!d.success) return d.error.issues[0]?.message ?? "Check the length.";
    if (override !== null && override.trim().length < 3) return "Write a short reason.";
    return null;
  }

  /** Server OK -> the row to put on screen (reply plus the names the reply leaves out). */
  async function submit(): Promise<DayAppointment | null> {
    const why = whyNot();
    if (why) {
      setError(why);
      return null;
    }
    setError(null);
    const reason = override?.trim() || undefined;
    try {
      const reply = req.move
        ? await rescheduleAppointment(req.move.id, {
            version: req.move.version,
            dateLocal,
            startMin: startMin!,
            doctorId,
            durationMin: minutes,
            overrideReason: reason,
          })
        : await bookAppointment({
            patientId: patient!.id,
            visitTypeId,
            doctorId,
            durationMin: minutes,
            dateLocal,
            startMin: startMin!,
            source: "phone",
            complaint: note.trim() || undefined,
            overrideReason: reason,
          });
      return {
        ...reply.appointment,
        patientName: patient!.fullName,
        patientCode: patient!.code,
        patientMobile: patient!.mobile,
        visitTypeLabel: reply.appointment.visitTypeLabel ?? visit?.label ?? "",
      };
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : "Could not book. Check the connection, then try again.";
      if (e instanceof ApiError && e.status === 409 && req.move) {
        setConflict(true);
        setError("This appointment was changed by someone else. Reload.");
      } else {
        setSoftRule(SOFT_RULE.test(msg) && override === null);
        setError(msg);
      }
      return null;
    }
  }

  return {
    patient,
    setPatient: touch(setPatient),
    visitTypes,
    visit,
    chooseVisit,
    minutes,
    setMinutes: touch(setMinutes),
    dateLocal,
    setDateLocal: touch(setDateLocal),
    time,
    setTime: touch(setTime),
    startMin,
    doctorId,
    setDoctorId: touch(setDoctorId),
    note,
    setNote: touch(setNote),
    override,
    setOverride,
    softRule,
    error,
    conflict,
    dirty,
    submit,
  };
}
