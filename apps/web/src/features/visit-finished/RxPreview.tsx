import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { problemText } from "../../api/problem-text";
import { PrintLayout } from "../../ui/print";
import { useSubmitOnce } from "../../ui/submit-guard";
import { clinicHeaderFromSettings } from "../print/clinic-header";
import { PrescriptionBody } from "../print/PrescriptionBody";
import { PrescriptionFooter } from "../print/PrescriptionSample";
import { bodyData } from "../print/PrintPrescriptionScreen";
import { getPrescriptionForPrint, issuePrescription, type PrescriptionDto } from "../prescriptions";
import { getQrImage } from "../settings/api";
import type { Part } from "./useVisitFinished";
import { useSheetZoom } from "./useSheetZoom";
import { VfIcon } from "./vf-icons";

type Props = {
  rx: Part<PrescriptionDto | null>;
  patientName: string;
  patientCode: string;
  onIssued: (p: PrescriptionDto) => void;
  onError: (text: string) => void;
  toast: (text: string) => void;
};

const STATUS: Record<string, [string, string]> = {
  draft: ["Draft", "vf-pill-warning"],
  issued: ["Issued", "vf-pill-success"],
  revised: ["Revised", "vf-pill-info"],
};

// Prescription preview (HTML 357-521): the same A4 sheet as the print (PrintLayout +
// PrescriptionBody), at true size by default, resizable (review Q6).
export function RxPreview({ rx, patientName, patientCode, onIssued, onError, toast }: Props) {
  const zoom = useSheetZoom();
  const { run, pending } = useSubmitOnce();
  const sheet = useSheetHeader(rx.state === "ok" ? rx.data : null);
  const data = rx.state === "ok" ? rx.data : null;
  const isDraft = data?.status === "draft";
  const [word, cls] = STATUS[data?.status ?? "draft"]!;
  const printUrl = (download: boolean) =>
    data ? `/app/print/prescription/${data.id}${download ? "?download=1" : ""}` : "#";

  return (
    <section className="vf-col" aria-labelledby="vf-rx-h">
      <div className="vf-bar">
        <div className="vf-row">
          <h2 id="vf-rx-h" className="vf-h2">
            Prescription preview
          </h2>
          {data && (
            <span className={`vf-pill ${cls}`}>{data.rxNo ? `${word} · ${data.rxNo}` : word}</span>
          )}
          {data && (
            <button
              type="button"
              className="vf-chip"
              title="Back to real A4 size"
              onClick={zoom.reset}
            >
              {Math.round(zoom.scale * 100)}%
            </button>
          )}
        </div>
        {data && (
          <div className="vf-row">
            <a
              className="vf-btn"
              href={printUrl(true)}
              target="_blank"
              rel="noreferrer"
              aria-disabled={isDraft}
              onClick={(e) => isDraft && e.preventDefault()}
            >
              <VfIcon name="download" /> Download
            </a>
            <a
              className="vf-btn"
              href={printUrl(false)}
              target="_blank"
              rel="noreferrer"
              aria-disabled={isDraft}
              onClick={(e) => isDraft && e.preventDefault()}
            >
              <VfIcon name="print" /> Print prescription
            </a>
          </div>
        )}
      </div>

      {isDraft && data && (
        <div className="vf-banner vf-banner-warning">
          <span className="vf-row">
            <VfIcon name="draft" /> Not issued: the patient has no paper.
          </span>
          <button
            type="button"
            className="vf-btn vf-btn-primary"
            disabled={pending}
            onClick={() =>
              void run(async () => {
                try {
                  onIssued(await issuePrescription(data.id, data.version));
                  toast("Prescription issued. Ready to print.");
                } catch (err) {
                  onError(problemText(err));
                }
              })
            }
          >
            {pending ? "Issuing..." : "Issue prescription"}
          </button>
        </div>
      )}

      {rx.state === "loading" && <Skeleton />}
      {rx.state === "error" && (
        <p className="vf-error-line">Could not load the prescription. {rx.message}</p>
      )}
      {rx.state === "ok" && !data && (
        <div className="vf-card vf-empty">No prescription for this visit.</div>
      )}
      {data && (
        <div className="vf-sheet-box">
          <div className="vf-sheet" style={{ zoom: zoom.scale }}>
            {isDraft && <span className="vf-watermark">DRAFT</span>}
            <PrintLayout
              size="A4"
              header="print"
              clinic={sheet.clinic}
              footer={<PrescriptionFooter doctorName={sheet.clinic.doctorName} qr={sheet.qr} />}
            >
              <PrescriptionBody data={bodyData(data, patientName, patientCode)} />
            </PrintLayout>
          </div>
          <span
            className="vf-handle vf-handle-x"
            role="slider"
            tabIndex={0}
            aria-label="Resize prescription width"
            aria-valuenow={Math.round(zoom.scale * 100)}
            aria-valuemin={70}
            aria-valuemax={130}
            {...zoom.handle("x")}
          />
          <span
            className="vf-handle vf-handle-y"
            role="slider"
            tabIndex={0}
            aria-label="Resize prescription height"
            aria-valuenow={Math.round(zoom.scale * 100)}
            aria-valuemin={70}
            aria-valuemax={130}
            {...zoom.handle("y")}
          />
          <span
            className="vf-handle vf-handle-xy"
            role="slider"
            tabIndex={0}
            aria-label="Resize prescription"
            aria-valuenow={Math.round(zoom.scale * 100)}
            aria-valuemin={70}
            aria-valuemax={130}
            {...zoom.handle("xy")}
          >
            <VfIcon name="resize" />
          </span>
        </div>
      )}
    </section>
  );
}

/** Clinic letterhead and QR for the sheet (same sources as the print screen). */
function useSheetHeader(rx: PrescriptionDto | null) {
  const [clinic, setClinic] = useState(clinicHeaderFromSettings([]));
  const [qr, setQr] = useState<string | null>(null);
  const rxId = rx?.id ?? null;
  useEffect(() => {
    getQrImage()
      .then((r) => setQr(r.value))
      .catch(() => setQr(null));
  }, []);
  useEffect(() => {
    if (!rxId) return;
    let cancelled = false;
    void Promise.all([
      getPrescriptionForPrint(rxId),
      api<{ settings: Array<{ key: string; value: unknown }> }>("/api/staff/settings"),
    ])
      .then(
        ([p, s]) => !cancelled && setClinic(clinicHeaderFromSettings(s.settings, p.doctorProfile)),
      )
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [rxId]);
  return { clinic, qr };
}

function Skeleton() {
  return (
    <div className="vf-card vf-skel-box" aria-busy="true">
      <div className="vf-skel" style={{ height: 56 }} />
      <div className="vf-skel" style={{ height: 48 }} />
      <div className="vf-skel" style={{ height: 176 }} />
      <div className="vf-skel" style={{ height: 80 }} />
    </div>
  );
}
