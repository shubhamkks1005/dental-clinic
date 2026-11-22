import { istDateTime, isStaffRole, type StaffMember } from "@clinic/shared";
import { useState } from "react";
import { StatusBadge } from "../../ui/StatusBadge";
import { changeRole, deactivate, reactivate, resetGoogleLink } from "./api";
import { ROLE_LABEL } from "./RolePicker";
import { DeactivatePanel, GooglePanel, RolePanel } from "./StaffPanels";

// Runs one change and shows the result; true when it was saved.
export type RunChange = (work: () => Promise<StaffMember[]>, done: string) => Promise<boolean>;

type PanelName = "role" | "google" | "deactivate" | null;

function signInText(member: StaffMember): string {
  if (!member.lastLoginAt) return "Not signed in yet";
  const last = `Last sign-in ${istDateTime(new Date(member.lastLoginAt))}`;
  return member.googleLinked ? last : `${last}. Google link reset: the next sign-in links it.`;
}

export function StaffRow({ member, run }: { member: StaffMember; run: RunChange }) {
  const [panel, setPanel] = useState<PanelName>(null);
  const [busy, setBusy] = useState(false);
  const name = member.name.split(" ")[0] ?? member.name;
  const active = member.status === "active";

  async function act(work: () => Promise<StaffMember[]>, done: string) {
    setBusy(true);
    const saved = await run(work, done);
    setBusy(false);
    if (saved) setPanel(null);
  }
  const panelProps = { member, busy, onCancel: () => setPanel(null) };

  return (
    <li className="staff-row">
      <div className="staff-who">
        <p className="staff-name">
          {member.name}
          {member.isYou && <span className="badge badge-in-room">You</span>}
        </p>
        <p className="staff-email muted">{member.email}</p>
        <p className="small muted">{signInText(member)}</p>
      </div>
      <div className="staff-tags">
        <span className="badge badge-upcoming">{ROLE_LABEL[member.role]}</span>
        <StatusBadge
          tone={active ? "done" : "upcoming"}
          label={active ? "Active" : "Deactivated"}
        />
      </div>

      {!member.isYou && panel === null && (
        <div className="staff-actions">
          {active ? (
            <>
              {isStaffRole(member.role) && (
                <button type="button" className="btn btn-compact" onClick={() => setPanel("role")}>
                  Change role
                </button>
              )}
              <button type="button" className="btn btn-compact" onClick={() => setPanel("google")}>
                Reset Google link
              </button>
              <button
                type="button"
                className="btn btn-compact"
                onClick={() => setPanel("deactivate")}
              >
                Deactivate
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-compact"
              disabled={busy}
              onClick={() => void act(() => reactivate(member), `${name} can sign in again.`)}
            >
              Reactivate
            </button>
          )}
        </div>
      )}

      {panel === "role" && (
        <RolePanel
          {...panelProps}
          onSave={(role) =>
            void act(() => changeRole(member, role), `${name} is now ${ROLE_LABEL[role]}.`)
          }
        />
      )}
      {panel === "google" && (
        <GooglePanel
          {...panelProps}
          onReset={(email) =>
            void act(
              () => resetGoogleLink(member, email),
              `Google link reset. ${name} signs in again with Google.`,
            )
          }
        />
      )}
      {panel === "deactivate" && (
        <DeactivatePanel
          {...panelProps}
          onDeactivate={() =>
            void act(() => deactivate(member), `${name} is deactivated and signed out.`)
          }
        />
      )}
    </li>
  );
}
