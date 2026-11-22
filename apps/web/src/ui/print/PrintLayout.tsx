import type { ReactNode } from "react";
import { Logo } from "../Logo";
import type { ClinicHeader, HeaderMode, PaperSize } from "./types";
import "./print.css";

// 1.4.8 print framework (browser printing; no server-side PDF). One sheet of A5 or A4 with the
// clinic header band (S13), or the same space left blank for pre-printed letterhead.
export function PrintLayout({
  size,
  header,
  clinic,
  children,
  footer,
}: {
  size: PaperSize;
  header: HeaderMode;
  clinic: ClinicHeader;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <article className={`print-page print-${size.toLowerCase()}`}>
      {header === "print" ? <HeaderBand clinic={clinic} /> : <div className="print-letterhead" />}
      <div className="print-body">{children}</div>
      {footer && <footer className="print-footer">{footer}</footer>}
    </article>
  );
}

function HeaderBand({ clinic }: { clinic: ClinicHeader }) {
  return (
    <header className="print-header">
      <div className="print-brand">
        {clinic.logo ? <img className="print-logo" src={clinic.logo} alt="" /> : <Logo />}
        <div>
          <p className="print-clinic">{clinic.name}</p>
          <p className="print-tagline">{clinic.tagline}</p>
        </div>
      </div>
      <div className="print-doctor">
        <p className="print-doctor-name">{clinic.doctorName}</p>
        <p>{clinic.qualifications}</p>
        <p>{clinic.speciality}</p>
        <p>Reg. no. {clinic.registrationNo}</p>
      </div>
      <p className="print-address">
        {clinic.address} · {clinic.phone}
      </p>
    </header>
  );
}
