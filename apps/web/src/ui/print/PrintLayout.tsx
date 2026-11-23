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
  duplicate,
  duplicateDate,
}: {
  size: PaperSize;
  header: HeaderMode;
  clinic: ClinicHeader;
  children: ReactNode;
  footer?: ReactNode;
  /** 4.3.5 reprint watermark */
  duplicate?: boolean;
  duplicateDate?: string;
}) {
  return (
    <article className={`print-page print-${size.toLowerCase()}`}>
      {duplicate ? (
        <p className="print-duplicate" aria-label="Duplicate copy">
          Duplicate copy{duplicateDate ? ` · ${duplicateDate}` : ""}
        </p>
      ) : null}
      {header === "print" ? <HeaderBand clinic={clinic} /> : <div className="print-letterhead" />}
      <div className="print-body">{children}</div>
      {footer && <footer className="print-footer">{footer}</footer>}
      {header === "print" ? <LetterFoot clinic={clinic} /> : null}
    </article>
  );
}

// Same shape as the clinic's own letterhead: name, tagline and contact on the left, the doctor on
// the right, one rule under it. Lines with nothing in Settings are left out.
function HeaderBand({ clinic }: { clinic: ClinicHeader }) {
  return (
    <header className="print-header">
      <div className="print-brand">
        {clinic.logo ? <img className="print-logo" src={clinic.logo} alt="" /> : <Logo />}
        <div>
          <p className="print-clinic">{clinic.name}</p>
          {clinic.tagline ? <p className="print-tagline">{clinic.tagline}</p> : null}
          {clinic.kind ? <p className="print-kind">{clinic.kind}</p> : null}
        </div>
      </div>
      <div className="print-contact">
        {clinic.phone ? <p>Phone: {clinic.phone}</p> : null}
        {clinic.email ? <p>Email: {clinic.email}</p> : null}
      </div>
      <div className="print-doctor">
        <p className="print-doctor-name">{clinic.doctorName}</p>
        <p>{clinic.qualifications}</p>
        <p>{clinic.speciality}</p>
        {clinic.extraLine ? <p>{clinic.extraLine}</p> : null}
        <p>Reg. no. {clinic.registrationNo}</p>
      </div>
    </header>
  );
}

// Bottom of every printed page (not on pre-printed paper): timings on the left, address and
// Instagram on the right.
function LetterFoot({ clinic }: { clinic: ClinicHeader }) {
  const hasTimings = clinic.timingsLines.length > 0;
  if (!hasTimings && !clinic.address && !clinic.instagram) return null;
  return (
    <div className="print-letterfoot">
      {hasTimings ? (
        <div className="print-timings">
          <p className="print-timings-title">Consultation Timings</p>
          {clinic.timingsLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      ) : null}
      <div className="print-places">
        {clinic.address ? <p>{clinic.address}</p> : null}
        {clinic.instagram ? <p>Instagram: {clinic.instagram}</p> : null}
      </div>
    </div>
  );
}
