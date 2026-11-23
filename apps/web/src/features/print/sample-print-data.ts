import type { ClinicHeader } from "../../ui/print";

// FAKE values for the printer check (1.4.8). Real clinic details come from Settings (1.5.2),
// real prescriptions from Phase 4. No real patient, no real medicine list.
export const SAMPLE_CLINIC: ClinicHeader = {
  name: "Sample Dental Clinic",
  tagline: "Tagline from Settings",
  logo: null,
  doctorName: "Dr. Sample Doctor",
  qualifications: "BDS, MDS",
  speciality: "Orthodontist (sample)",
  registrationNo: "[number]",
  address: "Sample address, Sample city 000000",
  phone: "+91 90000 00000",
  kind: "",
  email: "",
  instagram: "",
  extraLine: "",
  timingsLines: [],
};

export type SampleRx = {
  patient: string;
  ageGender: string;
  patientNo: string;
  mobile: string;
  date: string;
  visit: string;
  complaint: string;
  diagnosis: string;
  medicines: { name: string; note: string; frequency: string; duration: string }[];
  advice: string[];
  nextVisit: string;
};

export const SAMPLE_RX: SampleRx = {
  patient: "Sample Patient",
  ageGender: "34, Male",
  patientNo: "P-000412",
  mobile: "+919000000001",
  date: "2026-11-22",
  visit: "Braces adjustment",
  complaint: "Wire poking on the right side (sample text).",
  diagnosis: "Ulcer from wire irritation (sample text).",
  medicines: [
    {
      name: "Tab. [Medicine name] 500 mg",
      note: "After food",
      frequency: "1-0-1",
      duration: "5 days",
    },
    {
      name: "Tab. [Medicine name] 100 mg",
      note: "If needed for pain",
      frequency: "1-0-1",
      duration: "3 days",
    },
    {
      name: "Mouthwash [name]",
      note: "10 ml, gargle for 30 seconds",
      frequency: "0-0-1",
      duration: "7 days",
    },
  ],
  advice: [
    "Apply orthodontic wax on the area that pokes.",
    "Gargle with warm water morning and evening.",
    "Contact the clinic if a wire breaks or the pain increases.",
  ],
  nextVisit: "29/11/2026, 11:00, braces adjustment",
};
