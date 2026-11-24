import {
  formatDisplayDate,
  mergeNationalHolidays,
  parseDisplayDate,
  type Holiday,
} from "@clinic/shared";
import { useState, type FormEvent } from "react";
import { ApiError } from "../../api/client";
import { problemText } from "../../api/problem-text";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { Checkbox, DateInput, Field, TextInput } from "../../ui/form";
import { useSubmitOnce } from "../../ui/submit-guard";
import { useToast } from "../../ui/Toast";
import { saveSetting, type Versioned } from "./api";

// Days the clinic is closed (1.5.3 / 6.5.4 yearly + national). No slots on these dates.
export function HolidaysEditor({
  initial,
  canEdit,
  onSaved,
}: {
  initial: Versioned<Holiday[]>;
  canEdit: boolean;
  onSaved: () => void;
}) {
  const toast = useToast();
  const { run, pending } = useSubmitOnce();
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [yearly, setYearly] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Holiday | null>(null);
  const list = [...initial.value].sort((a, b) => a.date.localeCompare(b.date));

  const save = (next: Holiday[], done: string) =>
    run(async () => {
      try {
        await saveSetting("clinic.holidays", next, initial.version);
        toast({ text: done });
        onSaved();
      } catch (err) {
        toast({ text: problemText(err), tone: "error" });
        if (err instanceof ApiError && err.status === 409) onSaved();
      }
    });

  function add(event: FormEvent) {
    event.preventDefault();
    const iso = parseDisplayDate(date);
    if (!iso) return setProblem("Enter the date as DD/MM/YYYY, for example 26/01/2027.");
    const md = iso.slice(5);
    const clash = yearly
      ? list.some((h) => h.yearly && h.date.slice(5) === md)
      : list.some((h) => h.date === iso || (h.yearly && h.date.slice(5) === md));
    if (clash) return setProblem("This date is already a holiday.");
    setProblem(null);
    void save(
      [...list, { date: iso, note: note.trim(), yearly }],
      yearly ? "Yearly holiday added." : "Holiday added.",
    );
    setDate("");
    setNote("");
    setYearly(false);
  }

  function addNational() {
    const year = new Date().getFullYear() + 1;
    const next = mergeNationalHolidays(list, year);
    if (next.length === list.length) {
      toast({ text: "National holidays are already on the list." });
      return;
    }
    void save(next, "National holidays added (repeat every year).");
  }

  return (
    <section className="card settings-panel" aria-labelledby="holidays-title">
      <h2 id="holidays-title">Holidays</h2>
      <p className="muted">
        The clinic is closed on these days. Yearly holidays repeat every year. No appointments can
        be booked.
      </p>
      {list.length === 0 ? (
        <p className="holiday-empty muted">No holidays added.</p>
      ) : (
        <ul className="holiday-list">
          {list.map((h) => (
            <li key={`${h.date}-${h.yearly ? "y" : "1"}`}>
              <span>
                <strong>{formatDisplayDate(h.date)}</strong> {h.note}
                {h.yearly ? <span className="muted"> · every year</span> : null}
              </span>
              {canEdit && (
                <button
                  type="button"
                  className="btn btn-compact"
                  disabled={pending}
                  onClick={() => setRemoving(h)}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {canEdit && (
        <>
          <form className="holiday-add" onSubmit={add} noValidate>
            <Field label="Date" error={problem ?? undefined}>
              {(p) => <DateInput {...p} value={date} onChange={(e) => setDate(e.target.value)} />}
            </Field>
            <Field label="Note (optional)">
              {(p) => (
                <TextInput
                  className="input"
                  maxLength={60}
                  autoComplete="off"
                  {...p}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              )}
            </Field>
            <label className="settings-field-check">
              <Checkbox checked={yearly} onChange={(e) => setYearly(e.target.checked)} />
              <span>Repeat every year</span>
            </label>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              Add holiday
            </button>
          </form>
          <p className="settings-actions">
            <button type="button" className="btn" disabled={pending} onClick={addNational}>
              Add national holidays
            </button>
            <span className="muted">Republic Day, Independence Day, Gandhi Jayanti (DRAFT).</span>
          </p>
        </>
      )}
      <ConfirmDialog
        open={removing !== null}
        title="Remove this holiday?"
        message={
          removing
            ? `The clinic will be open on ${formatDisplayDate(removing.date)} again${
                removing.yearly ? " (and every year)" : ""
              }.`
            : ""
        }
        confirmLabel="Remove"
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          const target = removing;
          setRemoving(null);
          if (target)
            void save(
              list.filter(
                (h) => !(h.date === target.date && Boolean(h.yearly) === Boolean(target.yearly)),
              ),
              "Holiday removed.",
            );
        }}
      />
    </section>
  );
}
