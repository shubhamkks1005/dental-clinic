import { ageYearsOn, istDate, MINOR_UNDER_YEARS, parseDisplayDate } from "@clinic/shared";
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { useForm } from "react-hook-form";
import { ApiError } from "../../../api/client";
import {
  Checkbox,
  Field,
  MobileInput,
  Radio,
  Select,
  TextInput,
  Textarea,
  zodResolver,
} from "../../../ui/form";
import {
  checkPatientDuplicates,
  createPatient,
  type CreatedPatient,
  type DuplicateWarning,
} from "../../patients/api";
import { BirthAgeFields } from "../../patients/BirthAgeFields";
import { asksSamePerson } from "../../patients/DuplicateWarnings";
import {
  NEW_PATIENT_DEFAULTS,
  newPatientSchema,
  toCreateBody,
  type NewPatientFormValues,
  type NewPatientParsed,
} from "../../patients/new-patient-schema";
import { CalIcon } from "../CalIcon";
import { DuplicateNotice } from "./DuplicateNotice";
import type { PickedPatient } from "./useBookDraft";

export type NewPatientHandle = { save: (next: "only" | "book") => void };

// Panel 1 "+ New Patient" (HTML 647-776) on the app's own rules (P5.8): the New patient form's
// schema, guardian under 18, no gender default, duplicate check (first name + mobile asks "Same
// person?", mobile alone is a quiet line, never blocking), consents kept (L22).
export function NewPatientPanel({
  handle,
  inputsRef,
  onSaved,
  onPickExisting,
  onDirty,
}: {
  handle: Ref<NewPatientHandle>;
  inputsRef: Ref<HTMLDivElement>;
  onSaved: (p: CreatedPatient, next: "only" | "book", highlight: HTMLElement[]) => void;
  onPickExisting: (p: PickedPatient) => void;
  onDirty: () => void;
}) {
  const form = useRef<HTMLFormElement>(null);
  const next = useRef<"only" | "book">("book");
  const [warnings, setWarnings] = useState<DuplicateWarning[]>([]);
  const [ask, setAsk] = useState(false);
  const [asNew, setAsNew] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, watch, setValue, formState } = useForm<
    NewPatientFormValues,
    unknown,
    NewPatientParsed
  >({ resolver: zodResolver(newPatientSchema), defaultValues: NEW_PATIENT_DEFAULTS });
  const { errors, isDirty } = formState;
  const [fullName, mobile, noMobile, ageYears, birthDate, guardianMobile] = watch([
    "fullName",
    "mobile",
    "noMobile",
    "ageYears",
    "birthDate",
    "guardianMobile",
  ]);
  const today = istDate(new Date());
  const age = ageYearsOn(
    {
      dateOfBirth: parseDisplayDate(birthDate ?? ""),
      ageYearsAtReg: ageYears?.trim() ? Number(ageYears) : null,
      registeredOn: today,
    },
    today,
  );
  const minor = age !== null && age < MINOR_UNDER_YEARS;
  const noReminderNumber = Boolean(noMobile) && !guardianMobile?.trim();

  useEffect(() => {
    if (isDirty) onDirty();
  }, [isDirty, onDirty]);
  useEffect(() => {
    if (noReminderNumber) setValue("smsReminders", false);
  }, [noReminderNumber, setValue]);
  useEffect(() => {
    setAsk(false);
    setAsNew(false);
    if (noMobile || !fullName?.trim() || !mobile?.trim()) {
      setWarnings([]);
      return;
    }
    const t = window.setTimeout(() => {
      checkPatientDuplicates({ fullName: fullName.trim(), mobile: mobile.trim() })
        .then(setWarnings)
        .catch(() => setWarnings([]));
    }, 250);
    return () => window.clearTimeout(t);
  }, [fullName, mobile, noMobile]);

  useImperativeHandle(handle, () => ({
    save(n) {
      next.current = n;
      form.current?.requestSubmit();
    },
  }));

  const pick = (w: DuplicateWarning) =>
    onPickExisting({ id: w.id, code: w.code, fullName: w.fullName, mobile: w.mobile });

  return (
    <form
      ref={form}
      className="bk-newpat"
      noValidate
      onSubmit={handleSubmit(async (values) => {
        setFormError(null);
        if (asksSamePerson(warnings) && !asNew) {
          setAsk(true);
          return;
        }
        try {
          const created = await createPatient(toCreateBody(values));
          const box = form.current;
          const hl = box ? [...box.querySelectorAll<HTMLElement>("[data-flyer-hl]")] : [];
          onSaved(created, next.current, hl);
        } catch (e) {
          setFormError(
            e instanceof ApiError
              ? e.message
              : "Could not save. Check the connection, then try again.",
          );
        }
      })}
    >
      <div className="bk-topbar">
        <span className="bk-topbar-note">Patient number is given on save</span>
        <span className="bk-new-dot">
          <span aria-hidden="true" />
          New Registration
        </span>
      </div>
      <div ref={inputsRef} className="bk-primary">
        <Field label="Full Name *" error={errors.fullName?.message}>
          {(p) => (
            <TextInput
              data-flyer-hl=""
              placeholder="e.g. Ramesh Kumar"
              autoComplete="off"
              {...p}
              {...register("fullName")}
            />
          )}
        </Field>
        <div>
          <Field label="Mobile *" error={errors.mobile?.message}>
            {(p) => (
              <MobileInput data-flyer-hl="" disabled={noMobile} {...p} {...register("mobile")} />
            )}
          </Field>
          <label className="bk-check">
            <Checkbox {...register("noMobile")} />
            No mobile
          </label>
          {noMobile ? (
            <Field label="Why no mobile" error={errors.noMobileReason?.message}>
              {(p) => (
                <TextInput
                  placeholder="Reason (e.g. Elderly / Child)"
                  {...p}
                  {...register("noMobileReason")}
                />
              )}
            </Field>
          ) : null}
        </div>
      </div>
      <fieldset className="bk-fieldset">
        <legend className="bk-label">
          Gender <span className="bk-req">*</span>
        </legend>
        <div className="bk-seg">
          {(["female", "male", "other"] as const).map((g) => (
            <label key={g} className="bk-seg-item">
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
        birthDate={birthDate}
        setAge={(v) => setValue("ageYears", v)}
        ageLabel="Or age (years)"
      />
      {minor ? (
        <fieldset className="bk-guardian">
          <legend className="bk-label bk-label-icon">
            <CalIcon name="groups" />
            Guardian Details (needed under {MINOR_UNDER_YEARS})
          </legend>
          <Field label="Guardian Name" error={errors.guardianName?.message}>
            {(p) => <TextInput placeholder="Parent Name" {...p} {...register("guardianName")} />}
          </Field>
          <Field label="Relationship" error={errors.guardianRelation?.message}>
            {(p) => (
              <TextInput placeholder="Mother, father..." {...p} {...register("guardianRelation")} />
            )}
          </Field>
          <Field label="Guardian Phone" error={errors.guardianMobile?.message}>
            {(p) => <MobileInput {...p} {...register("guardianMobile")} />}
          </Field>
        </fieldset>
      ) : null}
      <details className="bk-details">
        <summary>
          <span className="bk-label-icon">
            <CalIcon name="tune" />
            <span>+ Additional Patient Details (Address, Contact, File #)</span>
          </span>
          <CalIcon name="expand_more" className="bk-chevron" />
        </summary>
        <div className="bk-details-body">
          <Field label="Whose mobile is this?">
            {(p) => (
              <Select {...p} {...register("contactRelation")}>
                <option value="self">Self</option>
                <option value="mother">Mother</option>
                <option value="father">Father</option>
                <option value="spouse">Spouse</option>
                <option value="guardian">Guardian</option>
                <option value="other">Other</option>
              </Select>
            )}
          </Field>
          <Field label="Locality / City" error={errors.area?.message}>
            {(p) => <TextInput placeholder="Bandra West, Mumbai" {...p} {...register("area")} />}
          </Field>
          <Field label="Old register no. (File #)" error={errors.legacyRef?.message}>
            {(p) => <TextInput {...p} {...register("legacyRef")} />}
          </Field>
          <Field label="Remarks" error={errors.notes?.message}>
            {(p) => <Textarea rows={2} {...p} {...register("notes")} />}
          </Field>
        </div>
      </details>
      <div className="bk-consents">
        <label className="bk-check">
          <Checkbox {...register("noticeShown")} />
          Privacy notice given
        </label>
        <label className="bk-check">
          <Checkbox disabled={noReminderNumber} {...register("smsReminders")} />
          Allow reminders
        </label>
      </div>
      <DuplicateNotice
        warnings={warnings}
        ask={ask}
        onPick={pick}
        onSaveAsNew={() => {
          setAsNew(true);
          setAsk(false);
          window.setTimeout(() => form.current?.requestSubmit(), 0);
        }}
      />
      {formError ? (
        <p className="bk-error" role="alert">
          {formError}
        </p>
      ) : null}
    </form>
  );
}
