import { NativeInput } from "../../../ui/form";
import { firstPage } from "@clinic/shared";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { icons } from "../../../ui/icons";
import { isSearchShortcut } from "../../../ui/shell/search-shortcut";
import { listPatients, type PatientListRow } from "../../patients";
import type { DoctorModel, DoctorRow } from "./doctor-model";

type Props = {
  model: DoctorModel;
  /** Rows to hide while the doctor types (empty set when the box is empty). */
  onHide: (ids: Set<string>) => void;
  /** Enter on a patient of today's list: scroll to the row and flash it. */
  onJump: (id: string) => void;
};

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

export function matches(row: Pick<DoctorRow, "name" | "patientCode">, q: string): boolean {
  const n = norm(q);
  return n === "" || norm(row.name).includes(n) || norm(row.patientCode).includes(n);
}

/**
 * Patient search of the doctor's Today (design: initDoctorSearch). Today's queue first and the list
 * filters while typing; other clinic patients come from the normal patient search (250 ms wait,
 * the older request is dropped). Enter on a queue patient flashes the row; on anyone else it opens
 * the profile. "/" focuses the box.
 */
export function DoctorSearch({ model, onHide, onJump }: Props) {
  const navigate = useNavigate();
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [others, setOthers] = useState<PatientListRow[]>([]);
  const [active, setActive] = useState(0);

  const queue = [...(model.chair ? [model.chair] : []), ...model.rows].filter((r) => matches(r, q));
  const inQueue = new Set(queue.map((r) => r.patientId));
  const clinic = others.filter((p) => !inQueue.has(p.id));
  const entries = [
    ...queue.map((r) => ({
      key: `q-${r.id}`,
      name: r.name,
      code: r.patientCode,
      sub: `Today · ${r.timeLabel}`,
      run: () => onJump(r.id),
    })),
    ...clinic.map((p) => ({
      key: `p-${p.id}`,
      name: p.fullName,
      code: p.code,
      sub: "Clinic patient",
      run: () => navigate(`/app/patients/${p.id}`),
    })),
  ];

  useEffect(() => {
    onHide(
      q.trim() === ""
        ? new Set()
        : new Set(model.rows.filter((r) => !matches(r, q)).map((r) => r.id)),
    );
    // Hiding follows the text and the list, not the callback's identity.
  }, [q, model.rows]);

  useEffect(() => {
    const text = q.trim();
    if (text.length < 2) {
      setOthers([]);
      return;
    }
    let current = true;
    const t = window.setTimeout(() => {
      listPatients({ ...firstPage("full_name"), q: text, pageSize: 6 })
        .then((page) => current && setOthers(page.rows))
        .catch(() => current && setOthers([]));
    }, 250);
    return () => {
      current = false;
      window.clearTimeout(t);
    };
  }, [q]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = input.current;
      if (!el || el.offsetParent === null) return;
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (
        !isSearchShortcut({
          key: e.key,
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
          altKey: e.altKey,
          target,
        })
      )
        return;
      e.preventDefault();
      el.focus();
      setOpen(true);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function clear() {
    setQ("");
    setOpen(false);
    input.current?.focus();
  }
  function choose(i: number) {
    const entry = entries[i];
    if (!entry) return;
    setOpen(false);
    entry.run();
  }
  function keys(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      if (q) clear();
      else setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(entries.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(active);
    }
  }

  return (
    <div
      className="td-search"
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}
    >
      <span className="td-search-icon" aria-hidden="true">
        {icons.search}
      </span>
      <NativeInput
        ref={input}
        type="search"
        className="td-search-input"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-label="Search patient by name, mobile, or patient number"
        placeholder="Search patient, mobile, or ID"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={keys}
      />
      {q ? (
        <button type="button" className="td-search-clear" aria-label="Clear search" onClick={clear}>
          {icons.close}
        </button>
      ) : (
        <kbd className="td-kbd" aria-hidden="true">
          /
        </kbd>
      )}
      <div
        className={`td-search-pop${open && q.trim() ? " is-open" : ""}`}
        role="listbox"
        aria-label="Matching patients"
      >
        <div className="td-search-head">
          <span>{entries.length === 0 ? "No match" : "Today's queue & clinic patients"}</span>
          <span>↑↓ navigate · Enter jump</span>
        </div>
        <ul>
          {entries.map((e, i) => (
            <li key={e.key} className="td-search-item" style={{ animationDelay: `${i * 18}ms` }}>
              <button
                type="button"
                role="option"
                aria-selected={i === active}
                className={i === active ? "is-active" : ""}
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={() => choose(i)}
              >
                <span className="td-name">{e.name}</span>
                <span className="td-sub">
                  {e.code} · {e.sub}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
