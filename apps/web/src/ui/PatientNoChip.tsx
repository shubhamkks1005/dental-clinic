// The patient number chip (DESIGN.md "Patient number"): shown wherever a patient appears.
export function PatientNoChip({ patientNo }: { patientNo: string }) {
  return <span className="patient-no">{patientNo}</span>;
}
