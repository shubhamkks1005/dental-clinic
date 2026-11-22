import {
  LIST_DEFS,
  listItemSchema,
  type ListDef,
  type ListField,
  type ListItemInput,
  type ListKey,
} from "@clinic/shared";
import { useForm } from "react-hook-form";
import { Field, zodResolver } from "../../ui/form";

function blankData(fields: readonly ListField[]): ListItemInput["data"] {
  return Object.fromEntries(
    fields.map((f) => [f.name, f.kind === "colour" ? "#1E4FA3" : (undefined as unknown as number)]),
  );
}

function ExtraField({
  field,
  register,
  error,
}: {
  field: ListField;
  register: ReturnType<typeof useForm<ListItemInput>>["register"];
  error?: string;
}) {
  if (field.kind === "colour") {
    return (
      <Field label={field.label} error={error}>
        {(p) => (
          <input
            className="input input-colour"
            type="color"
            {...p}
            {...register(`data.${field.name}`)}
          />
        )}
      </Field>
    );
  }
  return (
    <Field label={`${field.label} (${field.suffix})`} error={error}>
      {(p) => (
        <input
          className="input"
          type="number"
          inputMode="numeric"
          min={field.min}
          max={field.max}
          step={field.step}
          {...p}
          {...register(`data.${field.name}`, { valueAsNumber: true })}
        />
      )}
    </Field>
  );
}

// Add or edit one item: the name plus the list's own fields, all from the list config.
export function ItemForm({
  listKey,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  listKey: ListKey;
  initial?: ListItemInput;
  submitLabel: string;
  onSubmit: (input: ListItemInput) => Promise<boolean>;
  onCancel?: () => void;
}) {
  const def: ListDef = LIST_DEFS[listKey];
  // Blank extra fields must be named keys, or reset() leaves the last minutes in the input.
  const blank = (): ListItemInput => ({ label: "", data: blankData(def.fields) });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ListItemInput>({
    resolver: zodResolver(listItemSchema(listKey)),
    defaultValues: initial ?? blank(),
  });

  const submit = handleSubmit(async (input) => {
    const saved = await onSubmit(input);
    if (saved && !initial) reset(blank());
  });

  return (
    <form className="item-form" onSubmit={submit} noValidate>
      <Field label="Name" error={errors.label?.message}>
        {(p) => <input className="input" autoComplete="off" {...p} {...register("label")} />}
      </Field>
      {def.fields.map((f) => (
        <ExtraField
          key={f.name}
          field={f}
          register={register}
          error={errors.data?.[f.name]?.message as string | undefined}
        />
      ))}
      <div className="item-form-actions">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
