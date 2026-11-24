import { LIST_DEFS, type ListItem, type ListItemInput, type ListKey } from "@clinic/shared";
import { Drawer } from "../../ui/Drawer";
import { ItemForm } from "../lists";
import { MedicineAddForm } from "./MedicineAddForm";

export type DrawerState = { mode: "add" } | { mode: "edit"; item: ListItem } | null;

type Props = {
  listKey: ListKey;
  state: DrawerState;
  onClose: () => void;
  onAdd: (input: ListItemInput) => Promise<boolean>;
  onEdit: (item: ListItem, input: ListItemInput) => Promise<boolean>;
};

// One drawer for "Add" and "Edit". Medicines get the short add form; every other list (and every
// edit) uses the full item form built from the list's own fields.
export function LibraryDrawer({ listKey, state, onClose, onAdd, onEdit }: Props) {
  const name = LIST_DEFS[listKey].itemName;
  const title = state?.mode === "edit" ? `Edit ${name}` : `Add ${name}`;
  const reviewed = (input: ListItemInput): ListItemInput =>
    listKey === "medicines" ? { ...input, data: { ...input.data, reviewed: "yes" } } : input;
  return (
    <Drawer open={state !== null} onClose={onClose} title={title}>
      {state?.mode === "add" && listKey === "medicines" ? (
        <MedicineAddForm onSave={onAdd} onDone={onClose} />
      ) : state?.mode === "add" ? (
        <ItemForm
          listKey={listKey}
          submitLabel="Save"
          onSubmit={async (input) => {
            const saved = await onAdd(input);
            if (saved) onClose();
            return saved;
          }}
          onCancel={onClose}
        />
      ) : state?.mode === "edit" ? (
        <ItemForm
          listKey={listKey}
          initial={{ label: state.item.label, data: state.item.data }}
          submitLabel="Save"
          onSubmit={async (input) => {
            const saved = await onEdit(state.item, reviewed(input));
            if (saved) onClose();
            return saved;
          }}
          onCancel={onClose}
        />
      ) : null}
    </Drawer>
  );
}
