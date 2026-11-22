import { useEffect, useState } from "react";
import { Link } from "react-router";
import { PrintLayout, printTitle, type HeaderMode, type PaperSize } from "../../ui/print";
import { PrescriptionFooter, PrescriptionSample } from "./PrescriptionSample";
import { SAMPLE_CLINIC, SAMPLE_RX } from "./sample-print-data";
import "./prescription.css";
import "./print-screen.css";

// 1.4.8: the printer check page (S13 layout, sample data). Opens without the app frame; only
// the sheet prints.
export function PrintSampleScreen() {
  const [size, setSize] = useState<PaperSize>("A5");
  const [header, setHeader] = useState<HeaderMode>("print");

  useEffect(() => {
    const before = document.title;
    document.title = printTitle("Prescription", SAMPLE_RX.patientNo, SAMPLE_RX.date);
    return () => {
      document.title = before;
    };
  }, []);

  return (
    <main className="print-screen">
      <div className="card print-toolbar">
        <div>
          <h1>Printer check</h1>
          <p className="muted">
            A sample prescription with made-up details. Print it on the clinic printer.
          </p>
        </div>
        <label className="print-option">
          <span>Paper</span>
          <select
            className="input"
            value={size}
            onChange={(e) => setSize(e.target.value as PaperSize)}
          >
            <option value="A5">A5</option>
            <option value="A4">A4</option>
          </select>
        </label>
        <label className="print-option">
          <span>Header</span>
          <select
            className="input"
            value={header}
            onChange={(e) => setHeader(e.target.value as HeaderMode)}
          >
            <option value="print">Print the clinic header</option>
            <option value="blank">Leave space (letterhead paper)</option>
          </select>
        </label>
        <div className="print-actions">
          <button type="button" className="btn btn-primary" onClick={() => window.print()}>
            Print
          </button>
          <Link to="/app" className="btn">
            Back to the app
          </Link>
        </div>
      </div>
      <div className="print-scroll">
        <PrintLayout
          size={size}
          header={header}
          clinic={SAMPLE_CLINIC}
          footer={<PrescriptionFooter doctorName={SAMPLE_CLINIC.doctorName} />}
        >
          <PrescriptionSample rx={SAMPLE_RX} />
        </PrintLayout>
      </div>
    </main>
  );
}
