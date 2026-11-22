import type { StaffMember, StaffRole } from "@clinic/shared";
import { useState, type ReactNode } from "react";
import { shortName } from "../../ui/names";
import { RolePicker } from "./RolePicker";

type PanelProps = { member: StaffMember; busy: boolean; onCancel: () => void };

const firstName = (member: StaffMember) => shortName(member.name);

function Panel({
  label,
  busy,
  onConfirm,
  onCancel,
  children,
}: {
  label: string;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children: ReactNode;
}) {
  return (
    <form
      className="staff-panel"
      onSubmit={(e) => {
        e.preventDefault();
        onConfirm();
      }}
    >
      {children}
      <div className="staff-panel-buttons">
        <button type="submit" className="btn btn-primary btn-compact" disabled={busy}>
          {label}
        </button>
        <button type="button" className="btn btn-compact" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function RolePanel(props: PanelProps & { onSave: (role: StaffRole) => void }) {
  const { member } = props;
  const [role, setRole] = useState<StaffRole>(member.role === "doctor" ? "receptionist" : "doctor");
  return (
    <Panel label="Save role" {...props} onConfirm={() => props.onSave(role)}>
      <RolePicker name={`role-${member.id}`} value={role} onChange={setRole} />
      <p className="small muted">The new role applies on {firstName(member)}'s next click.</p>
    </Panel>
  );
}

export function GooglePanel(props: PanelProps & { onReset: (email: string) => void }) {
  const { member } = props;
  const [email, setEmail] = useState(member.email);
  return (
    <Panel label="Reset link" {...props} onConfirm={() => props.onReset(email)}>
      <p>
        Use this when {firstName(member)} has a new Gmail address or a new Google account. They are
        signed out now. Their next Google sign-in with this address links the account again.
      </p>
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
      </label>
    </Panel>
  );
}

export function DeactivatePanel(props: PanelProps & { onDeactivate: () => void }) {
  const name = firstName(props.member);
  return (
    <Panel label="Deactivate" {...props} onConfirm={props.onDeactivate}>
      <p>
        Deactivate {name}? {name} is signed out now and can't sign in until you reactivate them.
        Their records stay.
      </p>
    </Panel>
  );
}
