// What every printed page shows in its header. Comes from Settings > Clinic details (1.5.2);
// nothing here is hard-coded in a print screen.
export type ClinicHeader = {
  name: string;
  tagline: string;
  logo: string | null;
  doctorName: string;
  qualifications: string;
  speciality: string;
  registrationNo: string;
  address: string;
  phone: string;
};

export type PaperSize = "A4" | "A5";

// "print": the header band is printed. "blank": the same space is left empty, for paper with a
// pre-printed letterhead.
export type HeaderMode = "print" | "blank";
