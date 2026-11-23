import type { BlankFormKind } from "@clinic/shared";

/** One blank A4 form body (4.4.6). Repeated N times for a paper stack. */
export function BlankFormPages({ kind }: { kind: BlankFormKind }) {
  if (kind === "registration") return <RegistrationBlank />;
  if (kind === "medical_history") return <MedicalHistoryBlank />;
  return <ConsentBlank />;
}

function line(label: string) {
  return (
    <p className="blank-line">
      <span>{label}</span>
      <span className="blank-rule" />
    </p>
  );
}

function RegistrationBlank() {
  return (
    <div className="blank-form">
      <h2>Patient registration</h2>
      {line("Full name")}
      {line("Age / date of birth")}
      {line("Gender")}
      {line("Mobile")}
      {line("Area / address")}
      {line("Guardian (if under 18)")}
      {line("Emergency contact")}
      <p className="blank-note">Staff use only · fill and enter in the clinic software later</p>
    </div>
  );
}

function MedicalHistoryBlank() {
  return (
    <div className="blank-form">
      <h2>Medical history</h2>
      {line("Patient name")}
      {line("Patient no. (if known)")}
      <p className="blank-check">
        ☐ Heart disease &nbsp; ☐ Diabetes &nbsp; ☐ High BP &nbsp; ☐ Asthma
      </p>
      <p className="blank-check">
        ☐ Bleeding disorder &nbsp; ☐ Allergy &nbsp; ☐ Pregnancy &nbsp; ☐ Other
      </p>
      {line("Allergies / notes")}
      {line("Current medicines")}
      {line("Date")}
      <p className="blank-note">DRAFT checklist for paper downtime · enter in software later</p>
    </div>
  );
}

function ConsentBlank() {
  return (
    <div className="blank-form">
      <h2>Treatment consent (blank)</h2>
      <p className="blank-note">DRAFT - lawyer to confirm</p>
      {line("Patient name")}
      {line("Procedure")}
      <p className="blank-body">
        I understand the planned treatment, risks, and alternatives as explained by the dentist.
      </p>
      {line("Patient / guardian signature")}
      {line("Witness")}
      {line("Doctor")}
      {line("Date")}
    </div>
  );
}
