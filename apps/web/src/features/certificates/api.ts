import { api } from "../../api/client";

export type CertificateDto = {
  id: string;
  patientId: string;
  doctorId: string;
  status: "draft" | "finalised" | "revised";
  certNo: string | null;
  patientName: string;
  patientAge: string;
  patientAddress: string;
  identificationMark: string;
  signMethod: "signature" | "thumb";
  reason: string;
  fromOn: string;
  toOn: string;
  diagnosis: string | null;
  doctorRegistrationNo: string | null;
  revisedFromId: string | null;
  finalisedAt: string | null;
  version: number;
};

export function getCertificate(id: string) {
  return api<{ certificate: CertificateDto }>(
    `/api/staff/certificates/${encodeURIComponent(id)}`,
  ).then((r) => r.certificate);
}

export function listCertificateRegister() {
  return api<{ certificates: CertificateDto[] }>("/api/staff/certificates").then(
    (r) => r.certificates,
  );
}

export function listPatientCertificates(patientId: string) {
  return api<{ certificates: CertificateDto[] }>(
    `/api/staff/patients/${encodeURIComponent(patientId)}/certificates`,
  ).then((r) => r.certificates);
}

export function createCertificate(body: {
  patientId: string;
  patientName: string;
  patientAge: string;
  patientAddress: string;
  identificationMark: string;
  signMethod: "signature" | "thumb";
  reason: string;
  fromOn: string;
  toOn: string;
  diagnosis?: string | null;
}) {
  return api<{ certificate: CertificateDto }>("/api/staff/certificates", {
    method: "POST",
    body: JSON.stringify(body),
  }).then((r) => r.certificate);
}

export function finaliseCertificate(id: string, version: number) {
  return api<{ certificate: CertificateDto }>(
    `/api/staff/certificates/${encodeURIComponent(id)}/finalise`,
    { method: "POST", body: JSON.stringify({ version }) },
  ).then((r) => r.certificate);
}

export function reviseCertificate(id: string) {
  return api<{ certificate: CertificateDto }>(
    `/api/staff/certificates/${encodeURIComponent(id)}/revise`,
    { method: "POST", body: "{}" },
  ).then((r) => r.certificate);
}
