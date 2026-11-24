import { ageYearsOn, istDate, MINOR_UNDER_YEARS, parseDisplayDate } from "@clinic/shared";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import { ApiError } from "../../api/client";
import {
  Checkbox,
  Field,
  MobileInput,
  Radio,
  Select,
  TextInput,
  Textarea,
  zodResolver,
} from "../../ui/form";
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

export type AfterSave = "view" | "book" | "checkin";

type Props = { onCreated: (patient: CreatedPatient, next: AfterSave) => void };

// S03 / S16: four required fields on top; more details fold; Enter saves.
export function NewPatientForm({ onCreated }: Props) {
  const [params] = useSearchParams();
  const presetName = params.get("name")?.trim() || "";
  const [detailsOpen, setDetailsOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<DuplicateWarning[]>([]);
  // Q1.8: with a possible match on screen, Save asks "Same person?" once before it saves.
  const [askSamePerson, setAskSamePerson] = useState(false);
  const [saveAsNew, setSaveAsNew] = useState(false);
  // Choosing "Open existing" is a deliberate leave: no "unsaved changes" question.
  const [leaving, setLeaving] = useState(false);
  // Which button was pressed: Save patient, or save and go straight on to booking / check-in.
  const nextStep = useRef<AfterSave>("view");

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
  const guardianMobile = watch("guardianMobile");
  // Reminders have nobody to go to without a mobile (own or guardian's): the box is off, with the reason.
  const noReminderNumber = Boolean(noMobile) && !guardianMobile?.trim();

  const today = istDate(new Date());
  const typedAge = ageYearsOn(
    {
      dateOfBirth: parseDisplayDate(birthDate ?? ""),
      ageYearsAtReg: ageYears?.trim() ? Number(ageYears) : null,
      registeredOn: today,
    },
    today,
  );
  // Q1.8: a child needs a guardian, so the guardian fields open by themselves (not hidden in More details).
  const isMinorNow = typedAge !== null && typedAge < MINOR_UNDER_YEARS;

  useEffect(() => {
    if (noReminderNumber) setValue("smsReminders", false);
  }, [noReminderNumber, setValue]);

  useEffect(() => {
    setAskSamePerson(false);
    setSaveAsNew(false);
  }, [warnings]);

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
      ref={formRef}
      className="form new-patient-form"
      noValidate
      onSubmit={handleSubmit(async (values) => {
        setFormError(null);
        if (warnings.length > 0 && !saveAsNew) {
          setAskSamePerson(true);
          return;
        }
        try {
          const patient = await createPatient(toCreateBody(values));
          onCreated(patient, nextStep.current);
        } catch (err) {
          setFormError(
            err instanceof ApiError
              ? err.message
              : "Could not save. Check the connection, then try again.",
          );
        }
      })}
    >
      <UnsavedChangesGuard dirty={isDirty && !isSubmitting && !leaving} />

      <Field label="Full name" error={errors.fullName?.message}>
        {(p) => (
          <TextInput
            className="input"
            autoComplete="off"
            autoFocus
            {...p}
            {...register("fullName")}
          />
        )}
      </Field>

      <Field label="Mobile" error={errors.mobile?.message}>
        {(p) => <MobileInput disabled={noMobile} {...p} {...register("mobile")} />}
      </Field>
      <label className="new-patient-check">
        <Checkbox {...register("noMobile")} />
        No mobile
      </label>
      {noMobile && (
        <Field label="Why no mobile" error={errors.noMobileReason?.message}>
          {(p) => (
            <TextInput
              className="input"
              autoComplete="off"
              {...p}
              {...register("noMobileReason")}
            />
          )}
        </Field>
      )}

      <fieldset className="new-patient-gender">
        <legend>Gender</legend>
        <div className="new-patient-seg">
          {(["female", "male", "other"] as const).map((g) => (
            <label key={g} className="new-patient-seg-item">
              <Radio value={g} {...register("gender")} />
              <span>{g === "female" ? "Female" : g === "male" ? "Male" : "Other"}</span>
            </label>
          ))}
        </div>
        {errors.gender?.message ? <p className="field-error">{errors.gender.message}</p> : null}
      </fieldset>

      <BirthAgeFields
        register={register}
        errors={errors}
        birthDate={watch("birthDate")}
        setAge={(v) => setValue("ageYears", v)}
        ageLabel="Or age (years)"
      />

      <DuplicateWarnings
        warnings={warnings}
        ask={askSamePerson}
        onOpenExisting={() => flushSync(() => setLeaving(true))}
        onSaveAsNew={() => {
          setSaveAsNew(true);
          setAskSamePerson(false);
          window.setTimeout(() => formRef.current?.requestSubmit(), 0);
        }}
      />

      {(isMinorNow || detailsOpen) && (
        <fieldset className="new-patient-guardian">
          <legend>Guardian{isMinorNow ? " (needed under 18)" : ""}</legend>
          <Field
            label="Guardian name"
            hint="Required under 18"
            error={errors.guardianName?.message}
          >
            {(p) => (
              <TextInput
                className="input"
                autoComplete="off"
                {...p}
                {...register("guardianName")}
              />
            )}
          </Field>
          <Field label="Guardian relation" error={errors.guardianRelation?.message}>
            {(p) => (
              <TextInput
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
        </fieldset>
      )}

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
            {(p) => <TextInput className="input" autoComplete="off" {...p} {...register("area")} />}
          </Field>
          <Field
            label="Whose contact mobile"
            hint="Self, mother, father, spouse, guardian or other"
            error={errors.contactRelation?.message}
          >
            {(p) => (
              <Select className="input" {...p} {...register("contactRelation")}>
                <option value="self">Self</option>
                <option value="mother">Mother</option>
                <option value="father">Father</option>
                <option value="spouse">Spouse</option>
                <option value="guardian">Guardian</option>
                <option value="other">Other</option>
              </Select>
            )}
          </Field>
          <Field label="Emergency contact" error={errors.emergencyName?.message}>
            {(p) => (
              <TextInput
                className="input"
                autoComplete="off"
                {...p}
                {...register("emergencyName")}
              />
            )}
          </Field>
          <Field label="Old register no." error={errors.legacyRef?.message}>
            {(p) => (
              <TextInput className="input" autoComplete="off" {...p} {...register("legacyRef")} />
            )}
          </Field>
          <label className="new-patient-check">
            <Checkbox {...register("marketing")} />
            Promo messages (off by default)
          </label>
          <Field label="Notes" error={errors.notes?.message}>
            {(p) => <Textarea className="input" rows={3} {...p} {...register("notes")} />}
          </Field>
        </div>
      )}

      <fieldset className="new-patient-consents">
        <legend>Notice and consent</legend>
        <label className="new-patient-check">
          <Checkbox {...register("noticeShown")} />
          Privacy notice given
        </label>
        <label className="new-patient-check">
          <Checkbox disabled={noReminderNumber} {...register("smsReminders")} />
          Allow reminders
        </label>
        {noReminderNumber ? (
          <p className="small muted">
            Add a mobile number or a guardian's number to allow reminders.
          </p>
        ) : null}
      </fieldset>

      {formError && (
        <p className="notice notice-error" role="alert">
          {formError}
        </p>
      )}

      <div className="form-actions new-patient-actions">
        <button
          type="submit"
          className="btn"
          disabled={isSubmitting}
          onClick={() => (nextStep.current = "view")}
        >
          {isSubmitting ? "Saving…" : "Save patient"}
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
          onClick={() => (nextStep.current = "book")}
        >
          Save and book appointment
        </button>
        <button
          type="submit"
          className="btn"
          disabled={isSubmitting}
          onClick={() => (nextStep.current = "checkin")}
        >
          Save and check in now
        </button>
      </div>
    </form>
  );
}
