import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PrintLayout } from "./PrintLayout";
import type { ClinicHeader } from "./types";

const clinic: ClinicHeader = {
  name: "Fake Clinic",
  tagline: "Fake tagline",
  logo: null,
  doctorName: "Dr. Fake",
  qualifications: "BDS, MDS",
  speciality: "Orthodontist",
  registrationNo: "X-1",
  address: "1 Fake Road, Fake City",
  phone: "90000 00000",
  kind: "Fake and Dental Clinic",
  email: "fake@example.test",
  instagram: "fake_clinic",
  extraLine: "Former Fake Lecturer",
  timingsLines: ["Mon-Sat: 10:00 AM - 1:00 PM, 2:00 PM - 6:00 PM", "Sun: Closed"],
};

// Visible text in page order, like the printed sheet reads.
function text(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sheet(c: ClinicHeader, header: "print" | "blank" = "print") {
  return text(
    renderToStaticMarkup(
      <PrintLayout size="A4" header={header} clinic={c}>
        <p>BODY</p>
      </PrintLayout>,
    ),
  );
}

describe("PrintLayout letterhead", () => {
  it("reads like the clinic's own paper: brand and contact, doctor, body, timings, address", () => {
    expect(sheet(clinic)).toBe(
      "Fake Clinic Fake tagline Fake and Dental Clinic Phone: 90000 00000 Email: fake@example.test " +
        "Dr. Fake BDS, MDS Orthodontist Former Fake Lecturer Reg. no. X-1 BODY " +
        "Consultation Timings Mon-Sat: 10:00 AM - 1:00 PM, 2:00 PM - 6:00 PM Sun: Closed " +
        "1 Fake Road, Fake City Instagram: fake_clinic",
    );
  });

  it("leaves out lines that have nothing in Settings", () => {
    const bare = {
      ...clinic,
      kind: "",
      email: "",
      instagram: "",
      extraLine: "",
      timingsLines: [],
    };
    expect(sheet(bare)).toBe(
      "Fake Clinic Fake tagline Phone: 90000 00000 Dr. Fake BDS, MDS Orthodontist Reg. no. X-1 BODY 1 Fake Road, Fake City",
    );
  });

  it("pre-printed paper (blank header) prints only the body", () => {
    expect(sheet(clinic, "blank")).toBe("BODY");
  });
});
