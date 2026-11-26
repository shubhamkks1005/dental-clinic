import type { Doctor } from "@clinic/shared";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { useSubmitOnce } from "../../../ui/submit-guard";
import { useMe } from "../../auth";
import { listDoctors, type DayAppointment } from "../api";
import { CalIcon } from "../CalIcon";
import { longDate } from "../CalHeader";
import type { PreviewDraft } from "../SlotPreview";
import { BookFooter } from "./BookFooter";
import { MORPH_UNMOUNT_MS, POP_EXIT_MS, foldInto, reducedMotion } from "./motion";
import { NewPatientPanel, type NewPatientHandle } from "./NewPatientPanel";
import { SlotPanel } from "./SlotPanel";
import { bookedToast } from "./book-toasts";
import { useBookDraft, type BookRequest } from "./useBookDraft";
import { usePopoverPlace, type Anchor } from "./usePopoverPlace";
import { useSaveAndBook } from "./useSaveAndBook";
import "./book-popover.css";
import "./book-form.css";
import "./book-adjust.css";
import "./book-newpat.css";
import "./book-toast.css";
import "../cal-tokens.css";
import "../../../styles/design-fonts.css";

type Props = {
  request: BookRequest;
  doctors?: Doctor[];
  /** Live preview in the calendar column (P5.4.4). */
  onDraft?: (draft: PreviewDraft | null) => void;
  /** Date or time typed: the calendar returns the new cell to sit next to. */
  onRetarget?: (dateLocal: string, startMin: number) => Anchor | null;
  /** Server said yes. Return the new card (already on screen) for the fold morph, or null. */
  onBooked: (row: DayAppointment) => Promise<HTMLElement | null> | HTMLElement | null;
  onClose: () => void;
  onReload?: () => void;
};

const FOCUSABLE = "button:not(:disabled), input:not(:disabled), select, textarea, [href]";

// The side-anchored booking popover (HTML 483-803), one booking UI for the whole app (P7.4.1):
// anchored next to a calendar cell, centred when opened from a button. Book = morph into the slot.
export function BookPopover(p: Props) {
  const me = useMe();
  const req = p.request;
  const move = req.mode === "move";
  const [doctors, setDoctors] = useState<Doctor[]>(p.doctors ?? []);
  const onlyDoctor = doctors.length === 1 ? doctors[0]!.id : null;
  const d = useBookDraft(req, me, onlyDoctor);
  const [tab, setTab] = useState<"slot" | "new">("slot");
  const [newDirty, setNewDirty] = useState(false);
  const [asking, setAsking] = useState(false);
  const pop = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const inputsRef = useRef<HTMLDivElement>(null);
  const newPanel = useRef<NewPatientHandle>(null);
  const opener = useRef<Element | null>(document.activeElement);
  const leaving = useRef(false);
  const { run, pending } = useSubmitOnce();
  const place = usePopoverPlace(pop, { el: req.anchor, side: req.side });
  const { retarget, leave } = place;
  const saveAndBook = useSaveAndBook({ d, setTab, boxRef, inputsRef, close: () => exit() });

  useEffect(() => {
    if (!p.doctors)
      listDoctors()
        .then(setDoctors)
        .catch(() => setDoctors([]));
    else setDoctors(p.doctors);
  }, [p.doctors]);

  // Live preview + re-anchor when the date / time / length / patient change.
  const { onDraft, onRetarget } = p;
  useEffect(() => {
    if (d.startMin === null) return;
    onDraft?.({
      dateLocal: d.dateLocal,
      startMin: d.startMin,
      minutes: Number.isFinite(d.minutes) && d.minutes > 0 ? d.minutes : 5,
      patientName: d.patient?.fullName ?? null,
      visitLabel: d.visit?.label ?? null,
    });
    retarget(onRetarget?.(d.dateLocal, d.startMin) ?? null);
  }, [d.dateLocal, d.startMin, d.minutes, d.patient, d.visit, onDraft, onRetarget, retarget]);

  // Focus: the patient search, or the first chip when a patient is set (P5.7.12).
  useEffect(() => {
    const t = window.setTimeout(() => {
      (
        searchRef.current ?? pop.current?.querySelector<HTMLElement>(".bk-chip, .bk-doctor input")
      )?.focus();
    }, 0);
    return () => {
      window.clearTimeout(t);
      const back = opener.current;
      window.setTimeout(
        () => (back instanceof HTMLElement && back.isConnected ? back.focus() : null),
        0,
      );
    };
  }, []);

  const exit = useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    onDraft?.(null);
    leave();
    window.setTimeout(p.onClose, reducedMotion() ? 0 : POP_EXIT_MS);
  }, [onDraft, leave, p.onClose]);

  function requestClose() {
    if (pending || saveAndBook.running) return;
    if (d.dirty || newDirty) setAsking(true);
    else exit();
  }

  async function book() {
    const row = await run(() => d.submit());
    if (!row) return;
    leaving.current = true;
    onDraft?.(null);
    const target = await p.onBooked(row);
    const el = pop.current;
    if (target && el && !reducedMotion()) {
      place.leave(); // backdrop fades with the morph (M2)
      foldInto(el, target.getBoundingClientRect());
      window.setTimeout(() => {
        p.onClose();
        bookedToast(row, true, move);
      }, MORPH_UNMOUNT_MS);
    } else {
      place.leave();
      window.setTimeout(p.onClose, reducedMotion() ? 0 : POP_EXIT_MS);
      bookedToast(row, Boolean(target), move);
    }
  }

  function trap(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      if (asking) setAsking(false);
      else requestClose();
      return;
    }
    if (e.key !== "Tab" || !pop.current) return;
    const items = [...pop.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (x) => !x.closest("[inert]") && x.offsetParent !== null,
    );
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return createPortal(
    <div className="cal-scope bk-wrap">
      <div
        className={`bk-backdrop${place.entered ? " is-in" : ""}`}
        onClick={requestClose}
        aria-hidden="true"
      />
      <div
        ref={pop}
        className="bk-pop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bk-title"
        onKeyDown={trap}
      >
        <div className="bk-head">
          <div className="bk-head-left">
            <span className="bk-tile">
              <CalIcon name="calendar_add_on" />
            </span>
            <div className="bk-head-text">
              <h3 id="bk-title" className="bk-title">
                {move ? "Move appointment" : "Schedule Appointment"}
              </h3>
              <p className="bk-date">{longDate(d.dateLocal)}</p>
            </div>
          </div>
          <button
            type="button"
            className="bk-x"
            aria-label="Close without saving"
            title="Close without saving"
            onClick={requestClose}
          >
            <CalIcon name="close" />
          </button>
        </div>
        {move ? null : (
          <div className="bk-tabs-wrap">
            <div className="bk-tabs" role="tablist">
              <span
                className={`bk-tab-pill${tab === "new" ? " is-right" : ""}`}
                aria-hidden="true"
              />
              <button
                type="button"
                role="tab"
                aria-selected={tab === "slot"}
                className={`bk-tab${tab === "slot" ? " is-on" : ""}`}
                onClick={() => !saveAndBook.running && setTab("slot")}
              >
                <CalIcon name="person_search" />
                <span>Slot Selection</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "new"}
                className={`bk-tab${tab === "new" ? " is-on" : ""}`}
                onClick={() => !saveAndBook.running && setTab("new")}
              >
                <CalIcon name="person_add" />
                <span>+ New Patient</span>
              </button>
            </div>
          </div>
        )}
        <div className="bk-viewport">
          <div className={`bk-track${tab === "new" ? " is-new" : ""}`}>
            <div className="bk-panel cal-scroll" inert={tab !== "slot"}>
              <SlotPanel
                d={d}
                doctors={doctors}
                doctorLocked={me.role === "doctor"}
                move={move}
                boxHidden={saveAndBook.boxHidden}
                boxRef={boxRef}
                searchRef={searchRef}
                onNew={() => setTab("new")}
                onReload={() => {
                  p.onReload?.();
                  exit();
                }}
              />
            </div>
            <div className="bk-panel cal-scroll" inert={tab !== "new"}>
              {move ? null : (
                <NewPatientPanel
                  handle={newPanel}
                  inputsRef={inputsRef}
                  onDirty={() => setNewDirty(true)}
                  onSaved={saveAndBook.onSaved}
                  onPickExisting={(pt) => {
                    d.setPatient(pt);
                    setTab("slot");
                  }}
                />
              )}
            </div>
          </div>
        </div>
        <BookFooter
          tab={tab}
          move={move}
          pending={pending}
          onCancel={requestClose}
          onBook={() => void book()}
          onSave={(n) => newPanel.current?.save(n)}
        />
        {asking ? (
          <div className="bk-discard" role="alertdialog" aria-label="Discard this booking?">
            <p>Discard this booking?</p>
            <div className="bk-same-actions">
              <button type="button" className="bk-btn" autoFocus onClick={() => setAsking(false)}>
                Keep editing
              </button>
              <button
                type="button"
                className="bk-btn bk-btn-danger"
                onClick={() => {
                  setAsking(false);
                  exit();
                }}
              >
                Discard
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
