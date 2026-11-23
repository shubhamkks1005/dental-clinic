import { displayMobile } from "@clinic/shared";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ApiError } from "../../api/client";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { Field, MobileInput, zodResolver } from "../../ui/form";
import { BirthAgeFields } from "./BirthAgeFields";
import { UnsavedChangesGuard } from "../../ui/UnsavedChangesGuard";
import { updatePatient, type PatientDetail } from "./api";
import {
  defaultsFromPatient,
  newPatientSchema,
  toUpdateBody,
  type NewPatientFormValues,
  type NewPatientParsed,
} from "./new-patient-schema";

type Props = {
  patient: PatientDetail;
  onSaved: (patient: PatientDetail) => void;
  onCancel: () => void;
};

// 2.2.4: edit basic details; confirm when mobile changes; version on save.
export function PatientEditForm({ patient, onSaved, onCancel }: Props) {
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingBody, setPendingBody] = useState<Record<string, unknown> | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<NewPatientFormValues, unknown, NewPatientParsed>({
    resolver: zodResolver(newPatientSchema),
    defaultValues: defaultsFromPatient(patient),
  });

  const noMobile = watch("noMobile");

  async function save(body: Record<string, unknown>) {
    setFormError(null);
    try {
      const next = await updatePatient(patient.id, body);
      onSaved(next);
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : "Could not save. Check the connection, then try again.",
      );
    }
  }

  return (
    <>
      <form
        className="form patient-edit-form"
        noValidate
        onSubmit={handleSubmit(async (values) => {
          const body = toUpdateBody(values, patient.version);
          const nextMobile = body.mobile as string | null;
          if (nextMobile !== patient.mobile) {
            setPendingBody(body);
            return;
          }
          await save(body);
        })}
      >
        <UnsavedChangesGuard dirty={isDirty && !isSubmitting} />
        <Field label="Full name" error={errors.fullName?.message}>
          {(p) => <input className="input" autoComplete="off" {...p} {...register("fullName")} />}
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
          ageLabel="Or age at registration"
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
        <Field label="Other mobile" error={errors.mobileSecondary?.message}>
          {(p) => <MobileInput {...p} {...register("mobileSecondary")} />}
        </Field>
        <Field label="Area or address" error={errors.area?.message}>
          {(p) => <input className="input" autoComplete="off" {...p} {...register("area")} />}
        </Field>
        <Field label="Guardian name" error={errors.guardianName?.message}>
          {(p) => (
            <input className="input" autoComplete="off" {...p} {...register("guardianName")} />
          )}
        </Field>
        <Field label="Guardian relation" error={errors.guardianRelation?.message}>
          {(p) => (
            <input className="input" autoComplete="off" {...p} {...register("guardianRelation")} />
          )}
        </Field>
        <Field label="Guardian mobile" error={errors.guardianMobile?.message}>
          {(p) => <MobileInput {...p} {...register("guardianMobile")} />}
        </Field>
        <Field label="Notes" error={errors.notes?.message}>
          {(p) => <textarea className="input" rows={3} {...p} {...register("notes")} />}
        </Field>
        {formError && (
          <p className="notice notice-error" role="alert">
            {formError}
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="btn" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
      <ConfirmDialog
        open={pendingBody !== null}
        title="Change mobile number?"
        message={
          patient.mobile
            ? `Change mobile from ${displayMobile(patient.mobile)} to the new number?`
            : "Save a new mobile number for this patient?"
        }
        confirmLabel="Change mobile"
        busy={isSubmitting}
        onCancel={() => setPendingBody(null)}
        onConfirm={() => {
          const body = pendingBody;
          setPendingBody(null);
          if (body) void save(body);
        }}
      />
    </>
  );
}
