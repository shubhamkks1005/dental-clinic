import { useEffect, useState } from "react";
import { Link } from "react-router";
import { formatRupees, type CallListKind, type CallListRow } from "@clinic/shared";
import { problemText } from "../../api/problem-text";
import { useToast } from "../../ui/Toast";
import { sendPatientTemplate } from "../messages/api";
import { contactCallList, fetchCallList } from "./api";

/** 6.3.7: incomplete treatment + recall lists with contact notes. */
export function CallListsPanel() {
  const toast = useToast();
  const [kind, setKind] = useState<CallListKind>("incomplete");
  const [rows, setRows] = useState<CallListRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState("");

  async function load(k: CallListKind) {
    setLoading(true);
    try {
      setRows(await fetchCallList(k));
    } catch (err) {
      toast({ text: problemText(err), tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(kind);
  }, [kind]);

  async function onContact(patientId: string) {
    if (!note.trim()) {
      toast({ text: "Add a short note first.", tone: "error" });
      return;
    }
    try {
      await contactCallList(kind, patientId, note.trim());
      toast({ text: "Marked as contacted.", tone: "ok" });
      setNoteFor(null);
      setNote("");
      await load(kind);
    } catch (err) {
      toast({ text: problemText(err), tone: "error" });
    }
  }

  return (
    <section className="dash-call-lists card">
      <h2>Call lists</h2>
      <div className="dash-range-chips" role="group" aria-label="Call list type">
        <button
          type="button"
          className={
            kind === "incomplete" ? "btn dash-chip dash-chip-on" : "btn btn-secondary dash-chip"
          }
          aria-pressed={kind === "incomplete"}
          onClick={() => setKind("incomplete")}
        >
          Incomplete treatment
        </button>
        <button
          type="button"
          className={
            kind === "recall" ? "btn dash-chip dash-chip-on" : "btn btn-secondary dash-chip"
          }
          aria-pressed={kind === "recall"}
          onClick={() => setKind("recall")}
        >
          Recall due
        </button>
      </div>
      {loading ? <p className="muted">Loading…</p> : null}
      {!loading && rows.length === 0 ? (
        <p className="muted">No one on this list right now.</p>
      ) : null}
      <ul className="dash-call-rows">
        {rows.map((r) => (
          <li key={`${r.patientId}-${r.detail}`}>
            <div>
              <Link to={`/app/patients/${r.patientId}`}>
                {r.patientName} · {r.patientCode}
              </Link>
              <p className="muted small">{r.detail}</p>
              {r.amountPaise != null ? (
                <p className="small">{formatRupees(r.amountPaise)}</p>
              ) : null}
            </div>
            {noteFor === r.patientId ? (
              <div className="dash-call-note">
                <label>
                  Contact note
                  <input
                    className="input"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={500}
                  />
                </label>
                <button type="button" className="btn" onClick={() => void onContact(r.patientId)}>
                  Save contact
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setNoteFor(null);
                    setNote("");
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="row wrap gap-sm">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setNoteFor(r.patientId)}
                >
                  Contacted
                </button>
                <WhatsAppOutreachButton patientId={r.patientId} kind={kind} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 7.5.1 / 7.5.2: WhatsApp-only outreach; no treatment name in template. */
function WhatsAppOutreachButton({ patientId, kind }: { patientId: string; kind: CallListKind }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const templateKey = kind === "recall" ? "recall" : "incomplete";
  return (
    <button
      type="button"
      className="btn"
      disabled={busy}
      style={{ minHeight: 44 }}
      onClick={() => {
        setBusy(true);
        void sendPatientTemplate(patientId, templateKey)
          .then(({ waUrl }) => {
            if (waUrl) window.open(waUrl, "_blank", "noopener,noreferrer");
            toast({ text: "WhatsApp opened.", tone: "ok" });
          })
          .catch((err) => toast({ text: problemText(err), tone: "error" }))
          .finally(() => setBusy(false));
      }}
    >
      Send on WhatsApp
    </button>
  );
}
