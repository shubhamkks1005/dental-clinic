import { istDateTime, type ListItem, type ListItemInput, type ListKey } from "@clinic/shared";
import { useRef, useState, type FormEvent } from "react";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { Dialog } from "../../ui/Dialog";
import { UnsavedChangesGuard } from "../../ui/UnsavedChangesGuard";
import { useSubmitOnce } from "../../ui/submit-guard";
import { GenericForm } from "./GenericForm";
import { ITEM_WORD } from "./LibraryHeader";
import { LibraryIcon } from "./LibraryIcon";
import { draftFrom, sameDraft, toInput, type Draft } from "./library-draft";
import { MedicineForm } from "./MedicineForm";
import { SetForm, setProblem as setBlocker, withSetIds } from "./SetForm";
import "./library-modal.css";

export type ModalState = {
  listKey: ListKey;
  item?: ListItem;
  /** "Confirm" on a Needs review medicine: Edit filled in; Save marks it reviewed. */
  confirm?: boolean;
  /** Prefilled name (the set editor's "Add it to Medicines first"). */
  name?: string;
};

type Props = {
  state: ModalState;
  medicines: readonly ListItem[];
  categories: string[];
  /** Saves; returns a problem sentence, or null when saved. */
  onSave: (
    input: ListItemInput,
    item: ListItem | undefined,
    confirm: boolean,
  ) => Promise<string | null>;
  onClose: () => void;
  onNewMedicine: (name: string) => Promise<ListItem | null>;
};

const when = (iso?: string) => (iso ? istDateTime(new Date(iso)) : "-");

// HTML 380-395 on the app Dialog (focus trap, Esc, scroll kept). The look comes from .ld-modal.
export function LibraryModal({
  state,
  medicines,
  categories,
  onSave,
  onClose,
  onNewMedicine,
}: Props) {
  const { listKey, item, confirm = false } = state;
  const start = () => {
    const d = draftFrom(listKey, item);
    if (state.name) d.label = state.name;
    return listKey === "medicine_sets" ? withSetIds(d, medicines) : d;
  };
  const [initial, setInitial] = useState<Draft>(start);
  const [draft, setDraft] = useState<Draft>(initial);
  const [problem, setProblem] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [round, setRound] = useState(0);
  const { run, pending } = useSubmitOnce();
  const xRef = useRef<HTMLButtonElement>(null);
  // Close through the native dialog, so focus goes back to the button that opened it.
  const close = () => {
    const dialog = xRef.current?.closest("dialog");
    if (dialog?.open) dialog.close();
    else onClose();
  };
  const dirty = !sameDraft(draft, initial);
  const word = ITEM_WORD[listKey];
  const title = `${item ? "Edit" : "Add"} ${word}`;

  const ask = () => {
    if (!dirty) return true;
    setAsking(true);
    return false;
  };
  const leave = () => {
    if (ask()) close();
  };

  async function save(another: boolean) {
    const blocked = listKey === "medicine_sets" ? setBlocker(draft, medicines) : null;
    const checked = toInput(listKey, draft);
    if (blocked || !checked.ok) {
      setProblem(blocked ?? (checked.ok ? null : checked.problem));
      return;
    }
    await run(async () => {
      const failed = await onSave(checked.input, item, confirm);
      setProblem(failed);
      if (failed) return;
      if (!another) return close();
      const empty = draftFrom(listKey);
      setInitial(empty);
      setDraft(empty);
      setRound((r) => r + 1);
    });
  }
  const submit = (e: FormEvent) => {
    e.preventDefault();
    void save(false);
  };

  const common = { draft, onDraft: setDraft, autoFocus: true };
  return (
    <>
      <Dialog
        open
        title={title}
        onClose={onClose}
        className="ld-modal library-doc"
        beforeClose={ask}
      >
        <button ref={xRef} type="button" className="ld-modal-x" aria-label="Close" onClick={leave}>
          <LibraryIcon name="close" />
        </button>
        <form onSubmit={submit} noValidate key={round}>
          <div className="ld-modal-scroll">
            {listKey === "medicines" ? (
              <MedicineForm {...common} categories={categories} />
            ) : listKey === "medicine_sets" ? (
              <SetForm {...common} medicines={medicines} onNewMedicine={onNewMedicine} />
            ) : (
              <GenericForm {...common} listKey={listKey} />
            )}
            {item ? (
              <div className="ld-meta">
                <p className="ld-note">
                  Added {when(item.createdAt)} by {item.createdByName ?? "-"}
                </p>
                <p className="ld-note">
                  Last changed {when(item.updatedAt)} by {item.updatedByName ?? "-"}
                </p>
                <p className="ld-note">Past prescriptions, bills and visits keep their own copy.</p>
              </div>
            ) : null}
            {problem ? (
              <p className="ld-error" role="alert">
                {problem}
              </p>
            ) : null}
          </div>
          <div className="ld-modal-foot">
            <button type="button" className="ld-btn" onClick={leave}>
              Cancel
            </button>
            {!item ? (
              <button
                type="button"
                className="ld-btn"
                disabled={pending}
                onClick={() => void save(true)}
              >
                Save and add another
              </button>
            ) : null}
            <button type="submit" className="ld-btn-primary" disabled={pending}>
              <LibraryIcon name="save" className="ld-icon-sm" />
              <span>{pending ? "Saving..." : "Save"}</span>
            </button>
          </div>
        </form>
      </Dialog>
      <UnsavedChangesGuard dirty={dirty} />
      <ConfirmDialog
        open={asking}
        title="Leave without saving?"
        message="What you typed in this form is not saved yet. If you leave now, it is lost."
        confirmLabel="Leave"
        cancelLabel="Keep editing"
        onConfirm={() => {
          setAsking(false);
          close();
        }}
        onCancel={() => setAsking(false)}
      />
    </>
  );
}
