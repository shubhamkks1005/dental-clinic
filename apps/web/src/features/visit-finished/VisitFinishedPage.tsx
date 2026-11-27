import { useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { useMe } from "../auth";
import { InvoiceCard } from "./InvoiceCard";
import { istClock } from "./invoice-model";
import { NextWaiting } from "./NextWaiting";
import { RxPreview } from "./RxPreview";
import { TodayDetails } from "./TodayDetails";
import { useVisitFinished } from "./useVisitFinished";
import { VfHeader } from "./VfHeader";
import { VfIcon } from "./vf-icons";
import "./visit-finished.css";
import "./visit-finished-parts.css";

// Visit finished page (docs/design/final/visit_finished.html; handoff docs/design/handoff/
// visit-finished.md). Opens after Finalise. Doctor only: the desk sees a plain notice.
export function VisitFinishedPage() {
  const { id = "" } = useParams<{ id: string }>();
  const me = useMe();
  if (!me.permissions.includes("clinical.view")) return <Blocked />;
  return <Page visitId={id} />;
}

function Page({ visitId }: { visitId: string }) {
  const vf = useVisitFinished(visitId);
  const [toastText, setToastText] = useState<string | null>(null);
  const [toastKey, setToastKey] = useState(0);
  const [headError, setHeadError] = useState<string | null>(null);
  const [addendaOpen, setAddendaOpen] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);
  // One toast element (lessons): a new message replaces the old one and replays the entry.
  const toast = (text: string) => {
    setToastText(text);
    setToastKey((k) => k + 1);
  };
  const after = vf.after.state === "ok" ? vf.after.data : null;
  const rx = vf.rx.state === "ok" ? vf.rx.data : null;

  return (
    <div className="vf">
      <VfHeader
        visitId={visitId}
        finalisedAt={after?.visit.finalisedAt ?? null}
        patient={vf.patient}
        rx={rx}
        onAddAddendum={() => {
          setAddendaOpen(true);
          detailsRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
        }}
        onError={setHeadError}
        toast={toast}
      />
      {toastText && (
        <div key={toastKey} className="vf-toast" role="status" aria-live="polite">
          <span className="vf-row">
            <VfIcon name="check" /> {toastText}
          </span>
          <button
            type="button"
            className="vf-icon-btn"
            aria-label="Dismiss"
            onClick={() => setToastText(null)}
          >
            <VfIcon name="close" />
          </button>
        </div>
      )}
      {headError && (
        <p className="vf-error-line vf-head-error" role="alert">
          <VfIcon name="error" /> {headError}
        </p>
      )}
      <main className="vf-main">
        <div className="vf-top">
          <RxPreview
            rx={vf.rx}
            patientName={vf.patient?.fullName ?? ""}
            patientCode={vf.patient?.code ?? ""}
            onIssued={vf.setRxData}
            onError={setHeadError}
            toast={toast}
          />
          <div ref={detailsRef}>
            <TodayDetails
              after={vf.after}
              visitId={visitId}
              addendaOpen={addendaOpen}
              setAddendaOpen={setAddendaOpen}
              toast={toast}
              onRetry={() => void vf.retry()}
            >
              {after && (
                <NextWaiting doctorId={after.visit.doctorId} patientId={after.visit.patientId} />
              )}
            </TodayDetails>
          </div>
        </div>
        {vf.refreshFailed && vf.updatedAt && (
          <p className="vf-muted">Last updated {istClock(vf.updatedAt.toISOString())}</p>
        )}
        {vf.bill.state === "loading" && (
          <div className="vf-card vf-skel" style={{ height: 160 }} aria-busy="true" />
        )}
        {vf.bill.state === "error" && (
          <div className="vf-card vf-error-line" role="alert">
            <VfIcon name="error" />
            <span>
              <strong>Could not load invoice.</strong> The prescription preview and today&apos;s
              details are still available. {vf.bill.message}
            </span>
            <button type="button" className="vf-btn vf-btn-small" onClick={() => void vf.retry()}>
              <VfIcon name="refresh" /> Retry
            </button>
          </div>
        )}
        {vf.bill.state === "ok" && after && (
          <InvoiceCard
            key={vf.bill.data?.id ?? "none"}
            visitId={visitId}
            after={after}
            bill={vf.bill.data}
            setBill={vf.setBill}
            toast={toast}
          />
        )}
      </main>
    </div>
  );
}

function Blocked() {
  return (
    <div className="vf">
      <main className="vf-main vf-blocked">
        <div className="vf-card">
          <span className="vf-blocked-icon">
            <VfIcon name="lock" />
          </span>
          <h2 className="vf-h2">Doctor access only</h2>
          <p className="vf-muted">
            Only the doctor can see the visit. Your bill list is under Billing.
          </p>
          <div className="vf-row">
            <Link className="vf-btn vf-btn-primary" to="/app/billing">
              <VfIcon name="receipt" /> Go to Billing
            </Link>
            <Link className="vf-btn" to="/app">
              Back to Today
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
