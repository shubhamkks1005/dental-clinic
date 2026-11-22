import { useState } from "react";
import { Link } from "react-router";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { useSubmitOnce } from "../../ui/submit-guard";
import { useToast } from "../../ui/Toast";
import { UnsavedChangesGuard } from "../../ui/UnsavedChangesGuard";

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 1.4.6 feedback patterns with sample data only: toasts, confirm dialog, double-click guard,
// unsaved-changes warning.
export function FeedbackDemos() {
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [notes, setNotes] = useState("");
  const [savedNotes, setSavedNotes] = useState("");
  const [sent, setSent] = useState(0);
  const { run, pending } = useSubmitOnce();

  const save = () =>
    run(async () => {
      setSent((n) => n + 1);
      await pause(800);
      toast({ text: "Saved (sample)." });
    });

  return (
    <>
      <div className="guide-row">
        <button type="button" className="btn" onClick={() => toast({ text: "Saved (sample)." })}>
          Show a success toast
        </button>
        <button
          type="button"
          className="btn"
          onClick={() =>
            toast({
              text: "Could not save (sample). Check the internet connection.",
              tone: "error",
            })
          }
        >
          Show an error toast
        </button>
        <button type="button" className="btn" onClick={() => setConfirming(true)}>
          Remove sample item
        </button>
      </div>
      <div className="guide-row">
        <button
          type="button"
          className="btn btn-primary"
          disabled={pending}
          onClick={() => void save()}
        >
          {pending ? "Saving..." : "Save (try a double click)"}
        </button>
        <span className="small muted" aria-live="polite">
          Requests sent: {sent}
        </span>
      </div>
      <label className="guide-field">
        <span>Notes (sample): leaving with unsaved text asks first</span>
        <textarea
          className="input guide-textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <div className="guide-row">
        <button
          type="button"
          className="btn"
          disabled={notes === savedNotes}
          onClick={() => setSavedNotes(notes)}
        >
          Save notes
        </button>
        <Link to="/app">Go to Today</Link>
      </div>
      <UnsavedChangesGuard dirty={notes !== savedNotes} />
      <ConfirmDialog
        open={confirming}
        title="Remove this item?"
        message="This is a sample: nothing is stored or removed."
        confirmLabel="Remove"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          toast({ text: "Removed (sample)." });
        }}
      />
    </>
  );
}
