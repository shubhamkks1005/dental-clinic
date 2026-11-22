import { useState } from "react";
import { initials } from "../../ui/names";
import { ROLE_LABEL } from "../../ui/role-label";
import { signOut } from "./api";
import { useMe } from "./RequireStaff";
import "./user-card.css";

// "Name · Role" and Sign out (1.3.7). Shown in the laptop sidebar, the tablet top bar and the
// phone More screen; the surrounding CSS decides which one is visible.
export function UserCard() {
  const me = useMe();
  const [problem, setProblem] = useState(false);

  async function leave() {
    setProblem(false);
    try {
      await signOut();
      window.location.replace("/");
    } catch {
      setProblem(true);
    }
  }

  return (
    <div className="user-card">
      <span className="user-avatar" aria-hidden="true">
        {initials(me.name)}
      </span>
      <span className="user-text">
        <span className="user-name" title={me.name}>
          {me.name}
        </span>
        <span className="user-role small">{ROLE_LABEL[me.role]}</span>
      </span>
      <button type="button" className="btn btn-compact user-sign-out" onClick={() => void leave()}>
        Sign out
      </button>
      {problem && (
        <p className="user-problem small" role="alert">
          Could not sign out. Check the internet connection, then try again.
        </p>
      )}
    </div>
  );
}
