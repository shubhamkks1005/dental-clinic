import { useEffect, useState } from "react";
import { problemText } from "../../api/problem-text";
import { TextInput, Textarea } from "../../ui/form";
import { useSubmitOnce } from "../../ui/submit-guard";
import { addVisitAddendum, getVisit, type VisitAddendum } from "../visits/api";
import { istClock } from "./invoice-model";
import { VfIcon } from "./vf-icons";

type Props = {
  visitId: string;
  open: boolean;
  setOpen: (o: boolean) => void;
  toast: (t: string) => void;
};

// Addenda of the finalised visit + "Add addendum" (review Q3, Q8): the way to correct a locked
// visit when the prescription itself does not need a new version.
export function AddendaBlock({ visitId, open, setOpen, toast }: Props) {
  const [list, setList] = useState<VisitAddendum[]>([]);
  const [body, setBody] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { run, pending } = useSubmitOnce();

  useEffect(() => {
    getVisit(visitId)
      .then((v) => setList(v.addenda ?? []))
      .catch(() => setList([]));
  }, [visitId]);

  async function save() {
    setError(null);
    try {
      await addVisitAddendum(visitId, { body: body.trim(), reason: reason.trim(), kind: "note" });
      setList((await getVisit(visitId)).addenda ?? []);
      setBody("");
      setReason("");
      setOpen(false);
      toast("Addendum added to visit record.");
    } catch (err) {
      setError(problemText(err));
    }
  }

  return (
    <div className="vf-det-part" id="vf-addenda">
      <div className="vf-money-row">
        <span className="vf-label">Addenda</span>
        {!open && (
          <button type="button" className="vf-btn vf-btn-small" onClick={() => setOpen(true)}>
            <VfIcon name="add" /> Add addendum
          </button>
        )}
      </div>
      {list.length === 0 ? (
        <p className="vf-muted">No addenda yet.</p>
      ) : (
        list.map((a) => (
          <div key={a.id} className="vf-addendum">
            <span className="vf-muted">
              {istClock(a.recordedAt)} · {a.reason}
            </span>
            <span>{a.body}</span>
          </div>
        ))
      )}
      {open && (
        <div className="vf-addendum-form">
          <Textarea
            id="vf-addendum-input"
            rows={2}
            autoFocus
            value={body}
            placeholder="What to add to the visit record"
            aria-label="Addendum text"
            onChange={(e) => setBody(e.target.value)}
          />
          <TextInput
            value={reason}
            placeholder="Reason"
            aria-label="Reason"
            onChange={(e) => setReason(e.target.value)}
          />
          {error && <p className="vf-error-line">{error}</p>}
          <div className="vf-row">
            <button
              type="button"
              className="vf-btn vf-btn-primary"
              disabled={pending || !body.trim() || !reason.trim()}
              onClick={() => void run(save)}
            >
              {pending ? "Saving..." : "Save addendum"}
            </button>
            <button type="button" className="vf-btn" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
