import { useState } from "react";
import { Textarea } from "../../ui/form";

type Props = {
  complaint: string;
  findings: string;
  readOnly: boolean;
  onComplaint: (text: string) => void;
  onFindings: (text: string) => void;
};

type BoxId = "complaint" | "findings";
const TITLE: Record<BoxId, string> = {
  complaint: "Chief Complaints",
  findings: "Clinical Findings",
};

/**
 * The floating dock (design: cf-floating-dock): two frosted, resizable boxes that can fold into a
 * round bubble at the bottom left. Each box also folds to its title. Motion: 300 ms, the bubble
 * and the boxes scale from the bottom-left corner with the design's overshoot.
 */
export function ComplaintDock({ complaint, findings, readOnly, onComplaint, onFindings }: Props) {
  const [open, setOpen] = useState(true);
  const [folded, setFolded] = useState<Record<BoxId, boolean>>({
    complaint: false,
    findings: false,
  });
  const value = { complaint, findings };
  const change = { complaint: onComplaint, findings: onFindings };

  function box(id: BoxId, last: boolean) {
    const isFolded = folded[id];
    return (
      <div className="vd-dock-box" key={id}>
        <div className="vd-dock-head">
          <label htmlFor={`vd-dock-${id}`}>{TITLE[id]}</label>
          <span className="vd-dock-tools">
            <button
              type="button"
              className="vd-dock-btn"
              aria-label={`${isFolded ? "Expand" : "Minimize"} ${TITLE[id]}`}
              title={`${isFolded ? "Expand" : "Minimize"} ${TITLE[id]}`}
              onClick={() => setFolded((f) => ({ ...f, [id]: !f[id] }))}
            >
              {isFolded ? "+" : "−"}
            </button>
            {last && (
              <button
                type="button"
                className="vd-dock-btn is-solid"
                aria-label="Minimize to bottom-left circle"
                title="Minimize to bottom-left circle"
                onClick={() => setOpen(false)}
              >
                ↙
              </button>
            )}
          </span>
        </div>
        {!isFolded &&
          (readOnly ? (
            <p className="vd-dock-text">{value[id] || "Nothing written."}</p>
          ) : (
            <Textarea
              id={`vd-dock-${id}`}
              className="vd-dock-area"
              rows={4}
              placeholder={
                id === "complaint" ? "Write chief complaints..." : "Write clinical findings..."
              }
              value={value[id]}
              onChange={(e) => change[id](e.target.value)}
            />
          ))}
      </div>
    );
  }

  return (
    <div className="vd-dock" aria-label="Chief complaints and clinical findings">
      <button
        type="button"
        className={`vd-bubble${open ? "" : " is-shown"}`}
        aria-label="Expand Chief Complaints & Clinical Findings"
        title="Expand Chief Complaints & Clinical Findings"
        tabIndex={open ? -1 : 0}
        onClick={() => setOpen(true)}
      >
        <span className="vd-icon vd-bubble-icon">clinical_notes</span>
      </button>
      <div className={`vd-dock-block${open ? " is-shown" : ""}`} aria-hidden={!open}>
        {box("complaint", false)}
        {box("findings", true)}
      </div>
    </div>
  );
}
