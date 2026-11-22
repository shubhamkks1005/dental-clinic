import type { NewStaff, StaffMember } from "@clinic/shared";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { AddStaffForm } from "./AddStaffForm";
import { addStaff, getStaff } from "./api";
import { StaffRow, type RunChange } from "./StaffRow";
import "./staff.css";

type Notice = { tone: "ok" | "error"; text: string };

const OFFLINE = "Cannot reach the clinic server. Check the internet connection, then try again.";
const problemText = (err: unknown) => (err instanceof ApiError ? err.message : OFFLINE);

// Settings > Staff (1.3.6, doctor only): who can sign in with Google, and with which role.
export function StaffSettings() {
  const [staff, setStaff] = useState<StaffMember[] | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(() => {
    getStaff()
      .then(setStaff)
      .catch((err: unknown) => setNotice({ tone: "error", text: problemText(err) }));
  }, []);
  useEffect(load, [load]);

  const run: RunChange = async (work, done) => {
    try {
      setStaff(await work());
      setNotice({ tone: "ok", text: done });
      return true;
    } catch (err) {
      setNotice({ tone: "error", text: problemText(err) });
      // Someone changed this person meanwhile: show the latest list.
      if (err instanceof ApiError && err.status === 409) load();
      return false;
    }
  };

  async function add(input: NewStaff) {
    const first = input.name.split(" ")[0] ?? input.name;
    const saved = await run(
      () => addStaff(input),
      `${input.name} is added. Ask ${first} to open the clinic app, press "Sign in with Google" and choose ${input.email}.`,
    );
    if (saved) setAdding(false);
  }

  return (
    <section className="card settings-panel" aria-labelledby="staff-title">
      <div className="staff-head">
        <div>
          <h2 id="staff-title">Staff</h2>
          <p className="muted">People who can sign in to the clinic app with Google.</p>
        </div>
        {!adding && (
          <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
            Add staff
          </button>
        )}
      </div>

      {notice && (
        <p
          className={`notice notice-${notice.tone}`}
          role={notice.tone === "error" ? "alert" : "status"}
        >
          {notice.text}
        </p>
      )}
      {adding && <AddStaffForm onAdd={add} onCancel={() => setAdding(false)} />}

      {staff === null ? (
        <p className="muted">Loading staff...</p>
      ) : (
        <ul className="staff-list">
          {staff.map((member) => (
            <StaffRow key={member.id} member={member} run={run} />
          ))}
        </ul>
      )}
    </section>
  );
}
