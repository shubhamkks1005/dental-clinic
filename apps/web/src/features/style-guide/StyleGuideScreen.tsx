import { formatRupees } from "@clinic/shared";
import { PatientNoChip } from "../../ui/PatientNoChip";
import { StatusBadge } from "../../ui/StatusBadge";
import { ComponentDemos } from "./ComponentDemos";
import { SampleForm } from "./SampleForm";
import { SampleTable } from "./SampleTable";
import { BRAND, NEUTRALS, StatusPairs, SwatchList } from "./Swatches";
import "./style-guide.css";

// 1.4.1 style guide: every token and building block in one place (no mockup; DESIGN.md).
// Not in the menu; open /app/style-guide. Contrast is checked by styles/contrast.test.ts.
export function StyleGuideScreen() {
  return (
    <div className="guide">
      <header>
        <h1>Style guide</h1>
        <p className="muted">Colours, type and building blocks from DESIGN.md.</p>
      </header>

      <section className="card guide-card" aria-labelledby="g-colours">
        <h2 id="g-colours">Colours</h2>
        <SwatchList tokens={BRAND} />
        <SwatchList tokens={NEUTRALS} />
        <h3>Status (always with a word)</h3>
        <StatusPairs />
      </section>

      <section className="card guide-card" aria-labelledby="g-type">
        <h2 id="g-type">Type</h2>
        <p className="guide-title">Page title 26 / 700</p>
        <p className="guide-card-title">Card title 16 / 700</p>
        <p>Body text 14 / 400. Inter, with system fonts as fallback.</p>
        <p className="small muted">Small 12 / 400</p>
        <p className="guide-money">{formatRupees(1420050)}</p>
      </section>

      <section className="card guide-card" aria-labelledby="g-blocks">
        <h2 id="g-blocks">Building blocks</h2>
        <div className="guide-row">
          <button type="button" className="btn btn-primary">
            Main action
          </button>
          <button type="button" className="btn">
            Other action
          </button>
          <button type="button" className="btn btn-compact">
            Compact
          </button>
          <button type="button" className="btn" disabled>
            Disabled
          </button>
        </div>
        <div className="guide-row">
          <StatusBadge tone="done" label="Done" />
          <StatusBadge tone="in-room" label="In room" />
          <StatusBadge tone="waiting" label="Waiting" />
          <StatusBadge tone="emergency" label="Emergency" />
          <StatusBadge tone="upcoming" label="Upcoming" />
          <PatientNoChip patientNo="P-000412" />
        </div>
        <label className="guide-field">
          <span>Mobile number</span>
          <input className="input" type="tel" inputMode="numeric" placeholder="98xxx xxxxx" />
        </label>
        <p className="notice notice-ok">Saved.</p>
        <p className="notice notice-warning">Check this before you continue.</p>
        <p className="notice notice-error">Could not save. Check the internet connection.</p>
      </section>

      <section className="card guide-card" aria-labelledby="g-components">
        <h2 id="g-components">Components</h2>
        <ComponentDemos />
      </section>

      <section className="card guide-card" aria-labelledby="g-form">
        <h2 id="g-form">Form</h2>
        <SampleForm />
      </section>

      <section className="card guide-card" aria-labelledby="g-table">
        <h2 id="g-table">Data table</h2>
        <SampleTable />
      </section>
    </div>
  );
}
