import { useEffect, useState, type FormEvent } from "react";
import { problemText } from "../../api/problem-text";
import { closeRequest, getRequest, type RequestDetail } from "./api";
import { Textarea } from "../../ui/form";

// Doctor only. Opening a request is written to the access log by the server.
export function RequestDetailPanel({
  id,
  onClosed,
  onCancel,
}: {
  id: string;
  onClosed: () => void;
  onCancel: () => void;
}) {
  const [detail, setDetail] = useState<RequestDetail | null>(null);
  const [note, setNote] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getRequest(id)
      .then(setDetail)
      .catch((err: unknown) => setProblem(problemText(err)));
  }, [id]);

  async function submit(event: FormEvent, status: "done" | "rejected") {
    event.preventDefault();
    if (!detail || busy) return;
    setBusy(true);
    try {
      await closeRequest(id, { status, note, version: detail.version });
      onClosed();
    } catch (err) {
      setProblem(problemText(err));
      setBusy(false);
    }
  }

  if (!detail)
    return <p className={problem ? "notice error" : "muted"}>{problem ?? "Loading..."}</p>;
  return (
    <form className="req-detail" onSubmit={(e) => e.preventDefault()}>
      <p className="req-note">{detail.body}</p>
      {problem && <p className="notice error">{problem}</p>}
      {detail.status === "open" ? (
        <>
          <label htmlFor={`note-${id}`}>Closing note</label>
          <Textarea
            id={`note-${id}`}
            value={note}
            maxLength={500}
            rows={3}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="req-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={(e) => submit(e, "done")}
            >
              Mark done
            </button>
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={(e) => submit(e, "rejected")}
            >
              Reject
            </button>
            <button type="button" className="btn" onClick={onCancel}>
              Close panel
            </button>
          </div>
        </>
      ) : (
        <p className="muted">Closed: {detail.closedNote}</p>
      )}
    </form>
  );
}
