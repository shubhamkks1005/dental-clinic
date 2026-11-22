import { parseNewStaff, type NewStaff, type StaffRole } from "@clinic/shared";
import { useState, type FormEvent } from "react";
import { RolePicker } from "./RolePicker";

export function AddStaffForm({
  onAdd,
  onCancel,
}: {
  onAdd: (input: NewStaff) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("receptionist");
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseNewStaff({ name, email, role });
    if (!parsed.ok) {
      setProblem(parsed.message);
      return;
    }
    setProblem(null);
    setBusy(true);
    await onAdd(parsed.value);
    setBusy(false);
  }

  return (
    <form className="staff-panel" onSubmit={submit} noValidate>
      <h3>Add staff</h3>
      <label className="field">
        <span>Name</span>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
        />
      </label>
      <label className="field">
        <span>Gmail address</span>
        <input
          className="input"
          type="email"
          inputMode="email"
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <span className="small muted">They sign in with Google using exactly this address.</span>
      </label>
      <RolePicker name="new-role" value={role} onChange={setRole} />
      {problem && (
        <p className="notice notice-error" role="alert">
          {problem}
        </p>
      )}
      <div className="staff-panel-buttons">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          Add
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
