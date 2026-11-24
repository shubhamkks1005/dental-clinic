export type SetupValues = {
  doctorName: string;
  registrationNo: string;
  clinicPhone: string;
  clinicAddress: string;
};

export type SetupStep = { key: string; label: string; done: boolean };

const isSample = (v: string) => v.trim() === "" || /sample/i.test(v);

/** What is still the placeholder from the install. Printed papers show these, so they come first. */
export function setupSteps(v: SetupValues): SetupStep[] {
  return [
    { key: "doctor", label: "Doctor's name", done: !isSample(v.doctorName) },
    { key: "registration", label: "Registration number", done: v.registrationNo.trim() !== "" },
    {
      key: "phone",
      label: "Clinic phone",
      done: v.clinicPhone.trim() !== "" && !/^0+$/.test(v.clinicPhone.replace(/\D/g, "")),
    },
    { key: "address", label: "Clinic address", done: !isSample(v.clinicAddress) },
  ];
}
