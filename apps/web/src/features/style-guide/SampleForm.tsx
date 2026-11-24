import {
  displayDateField,
  displayMobile,
  formatDisplayDate,
  mobileField,
  personNameField,
} from "@clinic/shared";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { DateInput, Field, MobileInput, Select, TextInput, zodResolver } from "../../ui/form";

const schema = z.object({
  name: personNameField,
  mobile: mobileField,
  birthDate: displayDateField,
  visit: z.enum(["consultation", "follow-up", "braces"]),
});
type Input = z.input<typeof schema>;
type Output = z.output<typeof schema>;

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 1.4.4 form kit demo with FAKE data: keyboard only (Tab moves down, Enter saves), inline errors,
// focus jumps to the first wrong field, values come back normalised.
export function SampleForm() {
  const [saved, setSaved] = useState<Output | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Input, unknown, Output>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", mobile: "", birthDate: "", visit: "consultation" },
  });

  return (
    <form
      className="form"
      noValidate
      onSubmit={handleSubmit(async (values) => {
        await pause(300);
        setSaved(values);
      })}
    >
      <Field label="Name" error={errors.name?.message}>
        {(p) => <TextInput className="input" autoComplete="off" {...p} {...register("name")} />}
      </Field>
      <Field label="Mobile number" error={errors.mobile?.message}>
        {(p) => <MobileInput {...p} {...register("mobile")} />}
      </Field>
      <Field label="Date of birth" hint="For example 05/08/1990" error={errors.birthDate?.message}>
        {(p) => <DateInput {...p} {...register("birthDate")} />}
      </Field>
      <Field label="Visit type" error={errors.visit?.message}>
        {(p) => (
          <Select className="input" {...p} {...register("visit")}>
            <option value="consultation">Consultation</option>
            <option value="follow-up">Follow-up</option>
            <option value="braces">Braces adjustment</option>
          </Select>
        )}
      </Field>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </button>
      </div>
      {saved && (
        <p className="notice notice-ok" role="status">
          Saved (sample): {saved.name}, {displayMobile(saved.mobile)}, born{" "}
          {formatDisplayDate(saved.birthDate)}, {saved.visit}.
        </p>
      )}
    </form>
  );
}
