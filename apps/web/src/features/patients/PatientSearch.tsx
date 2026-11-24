import { displayAge, firstPage, istDate, type Page } from "@clinic/shared";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Link, useNavigate } from "react-router";
import { icons } from "../../ui/icons";
import { NEW_PATIENT_PATH } from "../../ui/shell/nav-items";
import { isSearchShortcut } from "../../ui/shell/search-shortcut";
import { listPatients, type PatientListRow } from "./api";
import "./patient-search.css";
import { TextInput } from "../../ui/form";

const GENDER = { female: "Female", male: "Male", other: "Other" } as const;

function last4(mobile: string | null): string {
  if (!mobile) return "—";
  const digits = mobile.replace(/\D/g, "");
  return digits.slice(-4) || "—";
}

function rowLabel(r: PatientListRow, today: string): string {
  const age = displayAge(
    {
      dateOfBirth: r.dateOfBirth,
      ageYearsAtReg: r.ageYearsAtReg,
      registeredOn: istDate(new Date(r.createdAt)),
    },
    today,
  );
  const bits = [age, GENDER[r.gender]].filter(Boolean).join(", ");
  return bits;
}

// 2.2.3: top-bar search — / focus, 250 ms debounce, arrows + Enter open profile.
export function PatientSearch() {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState<Page<PatientListRow> | null>(null);
  const [active, setActive] = useState(0);
  const today = istDate(new Date());

  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      const input = inputRef.current;
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (!input || input.offsetParent === null) return;
      if (
        !isSearchShortcut({
          key: event.key,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          altKey: event.altKey,
          target,
        })
      ) {
        return;
      }
      event.preventDefault();
      input.focus();
      setOpen(true);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const trimmed = q.trim();
    if (!trimmed) {
      setPage(null);
      return;
    }
    const t = window.setTimeout(() => {
      listPatients({ ...firstPage("full_name"), q: trimmed, pageSize: 8 })
        .then((next) => {
          setPage(next);
          setActive(0);
          setOpen(true);
        })
        .catch(() => setPage({ rows: [], total: 0, page: 1, pageSize: 8 }));
    }, 250);
    return () => window.clearTimeout(t);
  }, [q]);

  const rows = page?.rows ?? [];
  const showPanel = open && q.trim().length > 0;

  function go(id: string) {
    setOpen(false);
    setQ("");
    navigate(`/app/patients/${id}`);
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (!showPanel) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(rows.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const hit = rows[active];
      if (hit) go(hit.id);
      else if (rows.length === 0 && q.trim()) {
        navigate(`${NEW_PATIENT_PATH}?name=${encodeURIComponent(q.trim())}`);
        setOpen(false);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="patient-search">
      <label className="top-search">
        <span className="top-search-icon">{icons.search}</span>
        <span className="sr-only">Search patients (shortcut: /)</span>
        <TextInput
          ref={inputRef}
          className="input"
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          placeholder="Search by name, mobile or patient number"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
        />
        <kbd className="top-search-key" aria-hidden="true">
          /
        </kbd>
      </label>
      {showPanel && (
        <div className="patient-search-panel" id={listId} role="listbox">
          {rows.length === 0 && (
            <Link
              className="btn btn-primary patient-search-new"
              to={`${NEW_PATIENT_PATH}?name=${encodeURIComponent(q.trim())}`}
              onMouseDown={(e) => e.preventDefault()}
            >
              New patient: {q.trim()}
            </Link>
          )}
          {rows.map((r, i) => (
            <button
              key={r.id}
              type="button"
              role="option"
              aria-selected={i === active}
              className={`patient-search-row${i === active ? " is-active" : ""}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go(r.id)}
            >
              <span className="patient-search-name">{r.fullName}</span>
              <span className="muted">
                {rowLabel(r, today)} · ···{last4(r.mobile)} · {r.code}
              </span>
              <span className="muted patient-search-visit">Last visit —</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
