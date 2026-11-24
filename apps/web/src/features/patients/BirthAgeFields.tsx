import { istDate } from "@clinic/shared";
import { useEffect, useRef } from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { DateInput, Field, TextInput } from "../../ui/form";
import { ageFromBirthInput } from "./age-from-birth";
import type { NewPatientFormValues } from "./new-patient-schema";

type Props = {
  register: UseFormRegister<NewPatientFormValues>;
  errors: FieldErrors<NewPatientFormValues>;
  /** Live value of the date of birth box. */
  birthDate: string | undefined;
  setAge: (years: string) => void;
  ageLabel: string;
};

/**
 * Date of birth and age, one rule for the new and the edit form: a real date of birth fills the
 * age by itself (read only); without one the age can be typed (it then grows each year).
 */
export function BirthAgeFields({ register, errors, birthDate, setAge, ageLabel }: Props) {
  const computed = ageFromBirthInput(birthDate, istDate(new Date()));

  // Runs only when the computed age changes (setAge is a new function every render).
  const setAgeRef = useRef(setAge);
  setAgeRef.current = setAge;
  useEffect(() => {
    if (computed !== null) setAgeRef.current(String(computed));
  }, [computed]);

  return (
    <div className="new-patient-age-row">
      <Field label="Date of birth" hint="DD/MM/YYYY" error={errors.birthDate?.message}>
        {(p) => <DateInput {...p} {...register("birthDate")} />}
      </Field>
      <Field
        label={computed !== null ? "Age (from date of birth)" : ageLabel}
        hint={computed === null ? "Type it if the date of birth is not known" : undefined}
        error={errors.ageYears?.message}
      >
        {(p) => (
          <TextInput
            className="input"
            inputMode="numeric"
            autoComplete="off"
            readOnly={computed !== null}
            {...p}
            {...register("ageYears")}
          />
        )}
      </Field>
    </div>
  );
}
