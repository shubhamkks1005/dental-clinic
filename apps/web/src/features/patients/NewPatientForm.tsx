import { parseDisplayDate } from "@clinic/shared";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import { ApiError } from "../../api/client";
import { Field, MobileInput, zodResolver } from "../../ui/form";
import { BirthAgeFields } from "./BirthAgeFields";
import { UnsavedChangesGuard } from "../../ui/UnsavedChangesGuard";
import {
  checkPatientDuplicates,
  createPatient,
  type CreatedPatient,
  type DuplicateWarning,
} from "./api";
import { DuplicateWarnings } from "./DuplicateWarnings";
import {
  NEW_PATIENT_DEFAULTS,
  newPatientSchema,
  toCreateBody,
  type NewPatientFormValues,
  type NewPatientParsed,
} from "./new-patient-schema";

type Props = { onCreated: (patient: CreatedPatient) => void };

// S03 / S16: four required fields on top; more details fold; Enter saves.
export function NewPatientForm({ onCreated }: Props) {
  const [params] = useSearchParams();
  const presetName = params.get("name")?.trim() || "";
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<DuplicateWarning[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<NewPatientFormValues, unknown, NewPatientParsed>({
    resolver: zodResolver(newPatientSchema),
    defaultValues: { ...NEW_PATIENT_DEFAULTS, fullName: presetName },
  });

  const fullName = watch("fullName");
  const mobile = watch("mobile");
  const noMobile = watch("noMobile");
  const ageYears = watch("ageYears");
  const birthDate = watch("birthDate");

  useEffect(() => {
    if (noMobile || !fullName?.trim() || !mobile?.trim()) {
      setWarnings([]);
      return;
    }
    const t = window.setTimeout(() => {
      checkPatientDuplicates({
        fullName: fullName.trim(),
        mobile: mobile.trim(),
        ageYearsAtReg: ageYears?.trim() ? Number(ageYears) : null,
        dateOfBirth: parseDisplayDate(birthDate ?? ""),
      })
        .then(setWarnings)
        .catch(() => setWarnings([]));
    }, 250);
    return () => window.clearTimeout(t);
  }, [fullName, mobile, noMobile, ageYears, birthDate]);

  return (
    <form
      className="form new-patient-form"
      noValidate
      onSubmit={handleSubmit(async (values) => {
        setFormError(null);
        try {
          const patient = await createPatient(toCreateBody(values));
          onCreated(patient);
        } catch (err) {
          setFormError(
            err instanceof ApiError
              ? err.message
              : "Could not save. Check the connection, then try again.",
          );
        }
      })}
    >
      <UnsavedChangesGuard dirty={isDirty && !isSubmitting} />

      <div className="new-patient-code" aria-live="polite">
        <span className="new-patient-code-label">Patient no.</span>
        <span className="new-patient-code-box">Assigned automatically when you save</span>
      </div>

      <Field label="Full name" error={errors.fullName?.message}>
        {(p) => (
          <input className="input" autoComplete="off" autoFocus {...p} {...register("fullName")} />
        )}
      </Field>

      <Field label="Gender" error={errors.gender?.message}>
        {(p) => (
          <select className="input" {...p} {...register("gender")}>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        )}
      </Field>

      <BirthAgeFields
        register={register}
        errors={errors}
        birthDate={watch("birthDate")}
        setAge={(v) => setValue("ageYears", v)}
        ageLabel="Or age (years)"
      />

      <Field label="Mobile" error={errors.mobile?.message}>
        {(p) => <MobileInput disabled={noMobile} {...p} {...register("mobile")} />}
      </Field>
      <label className="new-patient-check">
        <input type="checkbox" {...register("noMobile")} />
        No mobile
      </label>
      {noMobile && (
        <Field label="Why no mobile" error={errors.noMobileReason?.message}>
          {(p) => (
            <input className="input" autoComplete="off" {...p} {...register("noMobileReason")} />
          )}
        </Field>
      )}

      <DuplicateWarnings warnings={warnings} />

      <button
        type="button"
        className="btn btn-ghost new-patient-more"
        aria-expanded={detailsOpen}
        onClick={() => setDetailsOpen((o) => !o)}
      >
        {detailsOpen ? "Hide extra details" : "More details"}
      </button>

      {detailsOpen && (
        <div className="new-patient-details">
          <Field label="Other mobile" error={errors.mobileSecondary?.message}>
            {(p) => <MobileInput {...p} {...register("mobileSecondary")} />}
          </Field>
          <Field label="Area or address" error={errors.area?.message}>
            {(p) => <input className="input" autoComplete="off" {...p} {...register("area")} />}
          </Field>
          <Field
            label="Guardian name"
            hint="Required under 18"
            error={errors.guardianName?.message}
          >
            {(p) => (
              <input className="input" autoComplete="off" {...p} {...register("guardianName")} />
            )}
          </Field>
          <Field label="Guardian relation" error={errors.guardianRelation?.message}>
            {(p) => (
              <input
                className="input"
                autoComplete="off"
                {...p}
                {...register("guardianRelation")}
              />
            )}
          </Field>
          <Field label="Guardian mobile" error={errors.guardianMobile?.message}>
            {(p) => <MobileInput {...p} {...register("guardianMobile")} />}
          </Field>
          <Field
            label="Whose contact mobile"
            hint="Self, mother, father, spouse, guardian or other"
            error={errors.contactRelation?.message}
          >
            {(p) => (
              <select className="input" {...p} {...register("contactRelation")}>
                <option value="self">Self</option>
                <option value="mother">Mother</option>
                <option value="father">Father</option>
                <option value="spouse">Spouse</option>
                <option value="guardian">Guardian</option>
                <option value="other">Other</option>
              </select>
            )}
          </Field>
          <Field label="Emergency contact" error={errors.emergencyName?.message}>
            {(p) => (
              <input className="input" autoComplete="off" {...p} {...register("emergencyName")} />
            )}
          </Field>
          <Field label="Old register no." error={errors.legacyRef?.message}>
            {(p) => (
              <input className="input" autoComplete="off" {...p} {...register("legacyRef")} />
            )}
          </Field>
          <Field label="Notes" error={errors.notes?.message}>
            {(p) => <textarea className="input" rows={3} {...p} {...register("notes")} />}
          </Field>
        </div>
      )}

      <fieldset className="new-patient-consents">
        <legend>Notice and consent</legend>
        <p className="muted">
          Patient can be saved without these. SMS reminders stay off until consent is recorded.
        </p>
        <label className="new-patient-check">
          <input type="checkbox" {...register("noticeShown")} />
          Privacy notice shown
        </label>
        <label className="new-patient-check">
          <input type="checkbox" {...register("smsReminders")} />
          SMS reminders allowed
        </label>
        <label className="new-patient-check">
          <input type="checkbox" {...register("marketing")} />
          Promo messages (off by default)
        </label>
      </fieldset>

      {formError && (
        <p className="notice notice-error" role="alert">
          {formError}
        </p>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save patient"}
        </button>
      </div>
    </form>
  );
}
