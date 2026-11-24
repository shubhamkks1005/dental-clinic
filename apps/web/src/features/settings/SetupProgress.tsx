import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getSetting } from "./api";
import { setupSteps, type SetupStep } from "./setup-progress";

// The card that replaces the "sample details" warnings that used to print on bills: what is
// still missing, each with a link to the place that fixes it.
export function SetupProgress() {
  const [steps, setSteps] = useState<SetupStep[] | null>(null);
  useEffect(() => {
    const read = (
      key: "doctor.name" | "doctor.registration_no" | "clinic.phone" | "clinic.address",
    ) => getSetting<string>(key).then((r) => String(r.value ?? ""));
    Promise.all([
      read("doctor.name"),
      read("doctor.registration_no"),
      read("clinic.phone"),
      read("clinic.address"),
    ])
      .then(([doctorName, registrationNo, clinicPhone, clinicAddress]) =>
        setSteps(setupSteps({ doctorName, registrationNo, clinicPhone, clinicAddress })),
      )
      .catch(() => setSteps(null));
  }, []);
  if (!steps) return null;
  const left = steps.filter((s) => !s.done);
  if (left.length === 0) return null;
  return (
    <section className="card setup-progress" aria-label="Setup progress">
      <p className="field-label">Setup progress</p>
      <p>
        <strong>
          {steps.length - left.length} of {steps.length}
        </strong>{" "}
        done. Printed bills and prescriptions show these until they are filled in.
      </p>
      <ul>
        {left.map((s) => (
          <li key={s.key}>
            <Link to="/app/settings/clinic">{s.label}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
