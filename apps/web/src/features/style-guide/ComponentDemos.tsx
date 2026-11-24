import { useState } from "react";
import { Dialog } from "../../ui/Dialog";
import { icons } from "../../ui/icons";
import { Menu } from "../../ui/Menu";
import { Tabs } from "../../ui/Tabs";
import { Tooltip } from "../../ui/Tooltip";
import { Select } from "../../ui/form";

// 1.4.2 components, each usable with the keyboard alone (Tab, Enter, Space, arrows, Esc).
export function ComponentDemos() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("reminders");
  const [picked, setPicked] = useState("nothing yet");

  return (
    <>
      <div className="guide-row">
        <button type="button" className="btn" onClick={() => setOpen(true)}>
          Open a dialog
        </button>
        <Tooltip text="Opens the help page (sample tooltip)">
          <button type="button" className="btn btn-compact" aria-label="Help">
            ?
          </button>
        </Tooltip>
        <Menu
          label="More actions"
          trigger={icons.more}
          items={[
            { label: "Edit", onSelect: () => setPicked("Edit") },
            { label: "Print", onSelect: () => setPicked("Print") },
            { label: "Archive (not allowed)", onSelect: () => {}, disabled: true },
          ]}
        />
        <span className="small muted" aria-live="polite">
          Menu choice: {picked}
        </span>
      </div>

      <label className="guide-field">
        <span>Visit type</span>
        <Select className="input" defaultValue="consultation">
          <option value="consultation">Consultation</option>
          <option value="follow-up">Follow-up</option>
          <option value="braces">Braces adjustment</option>
        </Select>
      </label>

      <Tabs
        label="Sample tabs"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "reminders", label: "Reminders", content: <p>Reminder messages (sample).</p> },
          { id: "recall", label: "Recall list", content: <p>Patients due for a check-up.</p> },
          { id: "templates", label: "Templates", content: <p>Message templates.</p> },
        ]}
      />

      <Dialog open={open} onClose={() => setOpen(false)} title="Sample dialog">
        <p>Press Esc, click outside, or use the button to close. Focus stays inside.</p>
        <div className="dialog-actions">
          <button type="button" className="btn btn-primary" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
      </Dialog>
    </>
  );
}
