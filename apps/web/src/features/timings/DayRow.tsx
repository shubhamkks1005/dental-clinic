import { DAY_NAMES, type DayKey, type Timings } from "@clinic/shared";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Checkbox, Field, TextInput } from "../../ui/form";

type DayErrors = FieldErrors<Timings["week"][DayKey]> | undefined;

// One day of the week: open or closed, opening and closing time, optional lunch break.
export function DayRow({
  day,
  open,
  register,
  errors,
}: {
  day: DayKey;
  open: boolean;
  register: UseFormRegister<Timings>;
  errors: DayErrors;
}) {
  const emptyIsNull = { setValueAs: (v: string) => (v === "" ? null : v) };
  return (
    <div className="day-row">
      <label className="day-open">
        <Checkbox {...register(`week.${day}.open`)} />
        <span>{DAY_NAMES[day]}</span>
      </label>
      {open ? (
        <div className="day-times">
          <Field label="Opens" error={errors?.start?.message}>
            {(p) => (
              <TextInput
                className="input"
                type="time"
                step={300}
                {...p}
                {...register(`week.${day}.start`)}
              />
            )}
          </Field>
          <Field label="Closes" error={errors?.end?.message}>
            {(p) => (
              <TextInput
                className="input"
                type="time"
                step={300}
                {...p}
                {...register(`week.${day}.end`)}
              />
            )}
          </Field>
          <Field label="Lunch from" error={errors?.lunchStart?.message}>
            {(p) => (
              <TextInput
                className="input"
                type="time"
                step={300}
                {...p}
                {...register(`week.${day}.lunchStart`, emptyIsNull)}
              />
            )}
          </Field>
          <Field label="Lunch to" error={errors?.lunchEnd?.message}>
            {(p) => (
              <TextInput
                className="input"
                type="time"
                step={300}
                {...p}
                {...register(`week.${day}.lunchEnd`, emptyIsNull)}
              />
            )}
          </Field>
        </div>
      ) : (
        <p className="muted day-closed">Closed</p>
      )}
    </div>
  );
}
