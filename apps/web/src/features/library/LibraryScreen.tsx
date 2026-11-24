import { isListKey, LIST_DEFS, type ListKey } from "@clinic/shared";
import { NavLink, Navigate, Route, Routes, useLocation, useParams } from "react-router";
import { PageHeader } from "../../ui/page/Page";
import { NotFound } from "../../ui/PageMessage";
import { ListEditor } from "../lists";
import { MedicinesListReview } from "../settings";
import "./library.css";

// Library.dc.html: the doctor's own lists, tabs first. Medicines come first because they are what
// the doctor adds most (also from inside a visit). Edits are versioned by the list editor.
const TABS: { to: string; label: string }[] = [
  { to: "medicines", label: "Medicines" },
  { to: "medicine_sets", label: "Medicine sets" },
  { to: "procedures", label: "Procedures and fees" },
  { to: "visit_types", label: "Visit types" },
  { to: "diagnoses", label: "Diagnoses" },
  { to: "quick_phrases", label: "Quick phrases" },
  { to: "more", label: "More" },
];

const MORE: ListKey[] = ["conditions", "allergens", "referral_sources", "medical_history_items"];

function ListTab() {
  const { key = "" } = useParams();
  if (!isListKey(key)) return <NotFound />;
  return (
    <>
      <ListEditor key={key} listKey={key} />
      {key === "medicines" ? <MedicinesListReview /> : null}
    </>
  );
}

function MoreTab() {
  return (
    <ul className="library-more">
      {MORE.map((key) => (
        <li key={key}>
          <NavLink className="card" to={`/app/library/${key}`}>
            <strong>{LIST_DEFS[key].title}</strong>
            <span className="muted small">{LIST_DEFS[key].help}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export function LibraryScreen() {
  const { pathname } = useLocation();
  return (
    <>
      <PageHeader title="Library" subtitle="Your medicines, procedures and fees." />
      <nav className="library-tabs" aria-label="Library lists">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={`/app/library/${t.to}`}
            className={({ isActive }) =>
              `pill${isActive || (t.to === "more" && MORE.some((k) => pathname.endsWith(`/${k}`))) ? " pill-on" : ""}`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
      <Routes>
        <Route index element={<Navigate to="medicines" replace />} />
        <Route path="more" element={<MoreTab />} />
        <Route path=":key" element={<ListTab />} />
      </Routes>
    </>
  );
}
