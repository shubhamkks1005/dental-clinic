import { DAY_KEYS, SLOT_LENGTHS, timingsSchema, type Timings } from "@clinic/shared";
import { useForm } from "react-hook-form";
import { ApiError } from "../../api/client";
import { problemText } from "../../api/problem-text";
import { Field, zodResolver } from "../../ui/form";
import { useToast } from "../../ui/Toast";
import { UnsavedChangesGuard } from "../../ui/UnsavedChangesGuard";
import { saveSetting, type Versioned } from "./api";
import { DayRow } from "./DayRow";

// Opening hours, slot length and chairs (1.5.3). The doctor edits; others see it read-only.
export function WeekForm({
  initial,
  canEdit,
  onSaved,
}: {
  initial: Versioned<Timings>;
  canEdit: boolean;
  onSaved: () => void;
}) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<Timings>({ resolver: zodResolver(timingsSchema), defaultValues: initial.value });

  const save = handleSubmit(async (value) => {
    try {
      await saveSetting("clinic.timings", value, initial.version);
      toast({ text: "Opening hours saved." });
      onSaved();
    } catch (err) {
      toast({ text: problemText(err), tone: "error" });
      if (err instanceof ApiError && err.status === 409) onSaved();
    }
  });

  return (
    <form className="card settings-panel" onSubmit={save} noValidate>
      <h2>Opening hours</h2>
      <p className="muted">Appointments can be booked only inside these hours.</p>
      <fieldset className="timings-fieldset" disabled={!canEdit}>
        <legend className="sr-only">Opening hours for each day</legend>
        <div className="week">
          {DAY_KEYS.map((day) => (
            <DayRow
              key={day}
              day={day}
              open={watch(`week.${day}.open`)}
              register={register}
              errors={errors.week?.[day]}
            />
          ))}
        </div>
        <div className="timings-extra">
          <Field label="Slot length" error={errors.slotMinutes?.message}>
            {(p) => (
              <select
                className="input"
                {...p}
                {...register("slotMinutes", { valueAsNumber: true })}
              >
                {SLOT_LENGTHS.map((m) => (
                  <option key={m} value={m}>
                    {m} minutes
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Chairs" error={errors.chairs?.message}>
            {(p) => (
              <input
                className="input"
                type="number"
                inputMode="numeric"
                min={1}
                max={10}
                {...p}
                {...register("chairs", { valueAsNumber: true })}
              />
            )}
          </Field>
        </div>
      </fieldset>
      {canEdit ? (
        <div className="form-actions timings-actions">
          <button type="submit" className="btn btn-primary" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? "Saving..." : "Save opening hours"}
          </button>
        </div>
      ) : (
        <p className="small muted timings-actions">Only the doctor can change the timings.</p>
      )}
      <UnsavedChangesGuard dirty={isDirty && !isSubmitting} />
    </form>
  );
}
