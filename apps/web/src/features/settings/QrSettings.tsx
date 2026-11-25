import { useEffect, useRef, useState } from "react";
import { api } from "../../api/client";
import { problemText } from "../../api/problem-text";
import { NativeInput } from "../../ui/form";
import { useMe } from "../auth";
import { putSetting } from "./api";
import { qrFileProblem } from "./qr-file";

type Qr = { value: string | null; version: number };

/** The doctor's QR picture for the prescription: choose a small PNG or JPEG, or remove it. */
export function QrSettings() {
  const canEdit = useMe().permissions.includes("settings.write");
  const [qr, setQr] = useState<Qr | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api<Qr>("/api/staff/clinic/qr")
      .then(setQr)
      .catch((err: unknown) => setProblem(problemText(err)));
  }, []);

  async function save(value: string | null) {
    if (!qr) return;
    setBusy(true);
    setProblem(null);
    try {
      const r = await putSetting<string | null>("clinic.qr_image", value, qr.version);
      setQr({ value: r.value, version: r.version });
    } catch (err) {
      setProblem(problemText(err));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  function choose(file: File | undefined) {
    if (!file) return;
    const why = qrFileProblem(file);
    if (why) {
      setProblem(why);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => void save(String(reader.result));
    reader.onerror = () => setProblem("Could not read that file. Try another picture.");
    reader.readAsDataURL(file);
  }

  return (
    <section className="card settings-card" aria-label="Prescription QR picture">
      <h2>QR picture on the prescription</h2>
      <p className="muted">
        A small PNG or JPEG (under 40 KB), for example your payment or clinic QR. It is printed on
        the prescription and shown in the live preview.
      </p>
      {problem && (
        <p className="notice notice-error" role="alert">
          {problem}
        </p>
      )}
      {qr?.value ? (
        <img src={qr.value} alt="Your QR picture" width={120} height={120} />
      ) : (
        <p className="muted">No QR picture yet.</p>
      )}
      {canEdit && (
        <div className="settings-actions">
          <label className="btn">
            {qr?.value ? "Change picture" : "Choose picture"}
            <NativeInput
              ref={input}
              type="file"
              accept="image/png,image/jpeg"
              hidden
              disabled={busy || !qr}
              onChange={(e) => choose(e.target.files?.[0])}
            />
          </label>
          {qr?.value && (
            <button type="button" className="btn" disabled={busy} onClick={() => void save(null)}>
              Remove
            </button>
          )}
        </div>
      )}
    </section>
  );
}
