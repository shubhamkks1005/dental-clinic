import { displayAge, displayMobile, formatClockTime, istDate } from "@clinic/shared";
import { Link } from "react-router";
import { formatDate, formatMoney } from "../../ui/format";
import { initials } from "../../ui/names";
import { PatientNoChip } from "../../ui/PatientNoChip";
import type { Column } from "../../ui/table";
import type { PatientListRow } from "./api";

const GENDER_LABEL = { female: "Female", male: "Male", other: "Other" } as const;

function ageGender(r: PatientListRow): string {
  const age = displayAge(
    {
      dateOfBirth: r.dateOfBirth,
      ageYearsAtReg: r.ageYearsAtReg,
      registeredOn: istDate(new Date(r.createdAt)),
    },
    istDate(new Date()),
  );
  return [age, GENDER_LABEL[r.gender]].filter(Boolean).join(", ");
}

function nextText(r: PatientListRow): string {
  return r.nextAppointment
    ? `${formatDate(r.nextAppointment.dateLocal)}, ${formatClockTime(r.nextAppointment.startMin)}`
    : "—";
}

function DueTag({ paise }: { paise: number }) {
  return paise > 0 ? <span className="patients-due">Due {formatMoney(paise)}</span> : null;
}

// S02: name, number, mobile, then the three things the desk looks for: last visit, next, due.
export const PATIENT_COLUMNS: Column<PatientListRow>[] = [
  {
    key: "full_name",
    label: "Name",
    sortable: true,
    render: (r) => (
      <span className="patients-name">
        <Link className="patients-name-main" to={`/app/patients/${r.id}`}>
          {r.fullName}
        </Link>
        <span className="muted patients-name-meta">{ageGender(r)}</span>
      </span>
    ),
  },
  {
    key: "code",
    label: "Patient no.",
    sortable: true,
    render: (r) => <PatientNoChip patientNo={r.code} />,
  },
  {
    key: "mobile",
    label: "Mobile",
    render: (r) => (r.mobile ? displayMobile(r.mobile) : "—"),
  },
  {
    key: "last_visit",
    label: "Last visit",
    render: (r) => (r.lastVisitOn ? formatDate(r.lastVisitOn) : "—"),
  },
  { key: "next", label: "Next appointment", render: nextText },
  {
    key: "due",
    label: "Due",
    render: (r) => ((r.duePaise ?? 0) > 0 ? <DueTag paise={r.duePaise ?? 0} /> : "—"),
  },
];

/** Phone card (PhonePatients.dc.html): the whole card is the link. */
export function PatientCard({ row }: { row: PatientListRow }) {
  const mobile = row.mobile ? displayMobile(row.mobile) : "No mobile";
  return (
    <Link className="patient-card" to={`/app/patients/${row.id}`}>
      <span className="patient-card-avatar" aria-hidden="true">
        {initials(row.fullName)}
      </span>
      <span className="patient-card-main">
        <span className="patient-card-name">{row.fullName}</span>
        <span className="muted patient-card-sub">
          {ageGender(row)} · {mobile}
        </span>
        {row.nextAppointment ? (
          <span className="muted patient-card-sub">Next: {nextText(row)}</span>
        ) : null}
      </span>
      <span className="patient-card-side">
        <PatientNoChip patientNo={row.code} />
        <DueTag paise={row.duePaise ?? 0} />
      </span>
    </Link>
  );
}
