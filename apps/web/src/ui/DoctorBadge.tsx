import { doctorColour, doctorShortName, type Doctor } from "@clinic/shared";
import type { CSSProperties } from "react";
import "./doctor-badge.css";

/** CSS variables of a doctor's fixed colour pair (--doc-fg text and dot, --doc-bg tint). */
export function doctorVars(doctor: Pick<Doctor, "colourIndex"> | null | undefined) {
  const c = doctorColour(doctor?.colourIndex ?? 0);
  return { "--doc-fg": c.fg, "--doc-bg": c.bg } as CSSProperties;
}

// Several doctors (2026-11-26): a doctor's mark is always the short name with a coloured dot,
// never the colour alone (L33). Used by the calendar, the desk Today rows, the print day list
// and the booking details panel.
export function DoctorBadge({
  doctor,
  full = false,
  className,
}: {
  doctor: Pick<Doctor, "name" | "colourIndex"> | null | undefined;
  /** Full name ("Dr. Arvind Mehta") instead of the short one ("Dr. Mehta"). */
  full?: boolean;
  className?: string;
}) {
  if (!doctor) return null;
  return (
    <span className={`doctor-badge${className ? ` ${className}` : ""}`} style={doctorVars(doctor)}>
      <span className="doctor-badge-dot" aria-hidden="true" />
      {full ? doctor.name : doctorShortName(doctor.name)}
    </span>
  );
}
