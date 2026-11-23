import type { ConsentTemplate } from "@clinic/shared";
import { ConsentBody } from "./ConsentBody";

type Lang = "hi" | "en";

// Fixed words around the doctor's text. Consent forms are Hindi; every other screen is English.
const LABELS: Record<Lang, Record<string, string>> = {
  hi: {
    patient: "मरीज का नाम",
    age: "आयु",
    mobile: "मोबाइल नंबर",
    date: "दिनांक",
    patientNo: "मरीज नंबर",
    tooth: "दाँत का नंबर / स्थान",
    doctor: "उपचार करने वाले डॉक्टर",
    patientSign: "मरीज के हस्ताक्षर / अंगूठे का निशान",
    guardianSign: "अभिभावक के हस्ताक्षर (यदि लागू हो)",
    doctorSign: "डॉक्टर के हस्ताक्षर",
    witnessSign: "गवाह का नाम एवं हस्ताक्षर",
  },
  en: {
    patient: "Patient",
    age: "Age",
    mobile: "Mobile",
    date: "Date",
    patientNo: "Patient no.",
    tooth: "Tooth / site",
    doctor: "Doctor",
    patientSign: "Patient signature or thumb impression",
    guardianSign: "Guardian signature (if applicable)",
    doctorSign: "Doctor signature",
    witnessSign: "Witness name and signature",
  },
};

export type ConsentSheetData = {
  patientName: string;
  patientCode: string;
  age: string;
  mobile: string;
  dateText: string;
  doctorName: string;
};

/** One consent form: patient strip, the doctor's text, one signature block for every form. */
export function ConsentSheet({
  tpl,
  lang,
  toothLine,
  data,
}: {
  tpl: ConsentTemplate;
  lang: Lang;
  toothLine: boolean;
  data: ConsentSheetData;
}) {
  const t = LABELS[lang];
  const hi = lang === "hi";
  return (
    <div className={`consent-sheet${hi ? " is-hindi" : ""}`} lang={hi ? "hi" : "en"}>
      <h2 className="consent-print-title">{tpl.printTitle ?? tpl.title}</h2>
      {hi ? <p className="consent-print-sub">{tpl.title.toUpperCase()} CONSENT FORM</p> : null}
      <dl className="consent-fields">
        <Field label={t.patient!} value={data.patientName} wide />
        <Field label={t.age!} value={data.age} />
        <Field label={t.mobile!} value={data.mobile} />
        <Field label={t.patientNo!} value={data.patientCode} />
        <Field label={t.date!} value={data.dateText} />
        <Field label={t.doctor!} value={data.doctorName} wide />
        {toothLine ? <Field label={t.tooth!} value="" wide /> : null}
      </dl>
      <ConsentBody body={tpl.body} />
      <div className="consent-print-signs">
        <p>{t.patientSign}: ______________________________</p>
        <p>{t.guardianSign}: ______________________________</p>
        <p>{t.doctorSign}: ______________________________</p>
        <p>{t.witnessSign}: ______________________________</p>
      </div>
    </div>
  );
}

function Field({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`consent-field${wide ? " is-wide" : ""}`}>
      <dt>{label}:</dt>
      <dd>{value}</dd>
    </div>
  );
}
