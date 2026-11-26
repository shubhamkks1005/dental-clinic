import { useEffect, useRef, useState, type RefObject } from "react";
import type { CreatedPatient } from "../../patients/api";
import { registeredToast, savedToast } from "./book-toasts";
import { runFlyer } from "./flyer";
import { reducedMotion } from "./motion";
import type { BookDraft } from "./useBookDraft";

// "Save & Book" after the server saved the patient and gave its code (P6.4.4, M15-M20):
// flyer lift, slide back to Slot Selection, dock onto the patient box, then the real box.
export function useSaveAndBook({
  d,
  setTab,
  boxRef,
  inputsRef,
  close,
}: {
  d: BookDraft;
  setTab: (t: "slot" | "new") => void;
  boxRef: RefObject<HTMLDivElement | null>;
  inputsRef: RefObject<HTMLDivElement | null>;
  close: () => void;
}) {
  const [running, setRunning] = useState(false);
  const [boxHidden, setBoxHidden] = useState(false);
  const cancel = useRef<(() => void) | null>(null);

  useEffect(() => () => cancel.current?.(), []);

  function onSaved(p: CreatedPatient, next: "only" | "book", highlight: HTMLElement[]) {
    const picked = { id: p.id, code: p.code, fullName: p.fullName, mobile: p.mobile };
    if (next === "only") {
      savedToast(p.code, p.fullName);
      close();
      return;
    }
    registeredToast(p.code, p.fullName);
    const source = inputsRef.current;
    if (!source || reducedMotion()) {
      d.setPatient(picked);
      setTab("slot");
      return;
    }
    cancel.current?.();
    setRunning(true);
    setBoxHidden(true);
    d.setPatient(picked);
    cancel.current = runFlyer({
      source,
      patient: { name: p.fullName, code: p.code, mobile: p.mobile },
      highlight,
      slideBack: () => setTab("slot"),
      target: () => boxRef.current,
      done: () => {
        setBoxHidden(false);
        setRunning(false);
        cancel.current = null;
      },
    });
  }

  return { onSaved, running, boxHidden };
}
