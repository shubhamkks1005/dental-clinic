import { displayAge, displayMobile, istDate, type PatientGender } from "@clinic/shared";

const GENDER: Record<PatientGender, string> = { female: "Female", male: "Male", other: "Other" };

type Source = {
  gender: PatientGender;
  dateOfBirth: string | null;
  ageYearsAtReg: number | null;
  createdAt: string;
  mobile: string | null;
};

/** Plain facts for the line under the patient's name on the visit screen. */
export function patientStripFacts(patient: Source, today: string) {
  const age = displayAge(
    {
      dateOfBirth: patient.dateOfBirth,
      ageYearsAtReg: patient.ageYearsAtReg,
      registeredOn: istDate(new Date(patient.createdAt)),
    },
    today,
  );
  return {
    ageGender: [age, GENDER[patient.gender]].filter(Boolean).join(" · "),
    mobile: patient.mobile ? displayMobile(patient.mobile) : "No mobile",
  };
}
