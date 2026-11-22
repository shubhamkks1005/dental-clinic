import {
  LIST_DEFS,
  listItemSchema,
  type ListDef,
  type ListItemInput,
  type ListKey,
} from "@clinic/shared";
import { useForm } from "react-hook-form";
import { Field, zodResolver } from "../../ui/form";

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
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ListItemInput>({
    resolver: zodResolver(listItemSchema(listKey)),
    defaultValues: initial ?? { label: "", data: {} },
  });

  const submit = handleSubmit(async (input) => {
    const saved = await onSubmit(input);
    if (saved && !initial) reset({ label: "", data: {} });
  });

  return (
    <form className="item-form" onSubmit={submit} noValidate>
      <Field label="Name" error={errors.label?.message}>
        {(p) => <input className="input" autoComplete="off" {...p} {...register("label")} />}
      </Field>
      {def.fields.map((f) => (
        <Field
          key={f.name}
          label={`${f.label} (${f.suffix})`}
          error={errors.data?.[f.name]?.message}
        >
          {(p) => (
            <input
              className="input"
              type="number"
              inputMode="numeric"
              min={f.min}
              max={f.max}
              step={f.step}
              {...p}
              {...register(`data.${f.name}`, { valueAsNumber: true })}
            />
          )}
        </Field>
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
