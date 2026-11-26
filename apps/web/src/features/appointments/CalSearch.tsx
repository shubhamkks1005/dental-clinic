import {
  doctorShortName,
  formatClockTime,
  APPOINTMENT_STATUS_LABEL,
  type AppointmentSearchHit,
} from "@clinic/shared";
import { useEffect, useRef, useState } from "react";
import { NativeInput } from "../../ui/form";
import { isSearchShortcut } from "../../ui/shell/search-shortcut";
import { searchAppointments } from "./api";
import { CalIcon } from "./CalIcon";
import { dayParts } from "./CalDayHead";

// Calendar search (Q7, P5.13): "when is Mrs Verma coming?" Coming bookings of the doctors ticked
// in the filter (a doctor: own only, the server decides). Look copied from the doctor Today search.
export function CalSearch({
  doctorIds,
  showDoctor,
  onJump,
}: {
  doctorIds: string[];
  showDoctor: boolean;
  onJump: (hit: AppointmentSearchHit) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<AppointmentSearchHit[] | null>(null);
  const [active, setActive] = useState(0);
  const doctorsKey = doctorIds.join(",");

  useEffect(() => {
    const text = q.trim();
    if (text.length < 2) {
      setHits(null);
      return;
    }
    let current = true;
    const t = window.setTimeout(() => {
      searchAppointments(text, doctorsKey ? doctorsKey.split(",") : [])
        .then((rows) => current && setHits(rows))
        .catch(() => current && setHits([]));
    }, 250);
    return () => {
      current = false;
      window.clearTimeout(t);
    };
  }, [q, doctorsKey]);

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

  const list = hits ?? [];
  function choose(i: number) {
    const hit = list[i];
    if (!hit) return;
    setOpen(false);
    onJump(hit);
  }
  function keys(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      if (q) setQ("");
      else setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(list.length - 1, a + 1));
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
      className="cal-search"
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}
    >
      <CalIcon name="search" className="cal-search-icon" />
      <NativeInput
        ref={input}
        type="search"
        className="cal-search-input"
        autoComplete="off"
        role="combobox"
        aria-expanded={open && hits !== null}
        aria-label="Find a booking by name, code or mobile"
        placeholder="Find a booking: name, code or mobile"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={keys}
      />
      {q ? null : (
        <kbd className="cal-kbd" aria-hidden="true">
          /
        </kbd>
      )}
      {open && hits !== null ? (
        <div className="cal-search-pop" role="listbox" aria-label="Coming bookings">
          {list.length === 0 ? (
            <p className="cal-search-empty">No coming bookings for “{q.trim()}”.</p>
          ) : (
            <ul>
              {list.map((h, i) => {
                const { weekday, date } = dayParts(h.dateLocal);
                const parts = [`${weekday} ${date}, ${formatClockTime(h.startMin)}`];
                if (showDoctor && h.doctorName) parts.push(doctorShortName(h.doctorName));
                parts.push(h.visitTypeLabel, APPOINTMENT_STATUS_LABEL[h.status]);
                return (
                  <li key={h.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={i === active}
                      className={i === active ? "is-active" : ""}
                      onMouseDown={(ev) => ev.preventDefault()}
                      onClick={() => choose(i)}
                    >
                      <span className="cal-search-name">
                        {h.patientName} · {h.patientCode}
                      </span>
                      <span className="cal-search-sub">{parts.join(" · ")}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
