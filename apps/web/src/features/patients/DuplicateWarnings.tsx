import { displayMobile } from "@clinic/shared";
import { Link } from "react-router";
import type { DuplicateWarning } from "./api";

const REASON: Record<DuplicateWarning["reason"], string> = {
  mobile_name: "Same mobile and a matching name",
  name_age: "Same name and similar age",
  secondary_mobile: "Matches another patient's other mobile",
};

// Soft only — never blocks save (2.1.7 / 2.2.1).
export function DuplicateWarnings({ warnings }: { warnings: DuplicateWarning[] }) {
  if (warnings.length === 0) return null;
  return (
    <div className="notice notice-warning new-patient-dupes" role="status">
      <p>Possible match — check before saving:</p>
      <ul>
        {warnings.map((w) => (
          <li key={w.id}>
            <Link to={`/app/patients/${w.id}/consents`}>
              {w.fullName} ({w.code})
            </Link>
            {w.mobile ? ` · ${displayMobile(w.mobile)}` : ""} — {REASON[w.reason]}
          </li>
        ))}
      </ul>
    </div>
  );
}
