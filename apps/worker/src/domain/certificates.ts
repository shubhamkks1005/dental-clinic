import {
  parseCreateCertificate,
  parseFinaliseCertificate,
  parsePatchCertificate,
} from "@clinic/shared";
import type { Repos } from "@clinic/db";

export async function createCertificate(repos: Repos, body: unknown) {
  const parsed = parseCreateCertificate(body);
  if (!parsed.ok) return { ok: false as const, message: parsed.message };
  const certificate = await repos.certificates.create(parsed.value);
  return { ok: true as const, certificate };
}

export async function getCertificate(repos: Repos, id: string) {
  const certificate = await repos.certificates.get(id);
  return { ok: true as const, certificate };
}

export async function patchCertificate(repos: Repos, id: string, body: unknown) {
  const parsed = parsePatchCertificate(body);
  if (!parsed.ok) return { ok: false as const, message: parsed.message };
  const certificate = await repos.certificates.patch(id, parsed.value);
  return { ok: true as const, certificate };
}

export async function finaliseCertificate(repos: Repos, id: string, body: unknown) {
  const parsed = parseFinaliseCertificate(body);
  if (!parsed.ok) return { ok: false as const, message: parsed.message };
  const certificate = await repos.certificates.finalise(id, parsed.value.version);
  return { ok: true as const, certificate };
}

export async function reviseCertificate(repos: Repos, id: string) {
  const certificate = await repos.certificates.revise(id);
  return { ok: true as const, certificate };
}

export async function listCertificateRegister(repos: Repos) {
  const certificates = await repos.certificates.listRegister();
  return { ok: true as const, certificates };
}

export async function listPatientCertificates(repos: Repos, patientId: string) {
  const certificates = await repos.certificates.listForPatient(patientId);
  return { ok: true as const, certificates };
}
