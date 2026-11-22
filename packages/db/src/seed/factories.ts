import { generateFakePatients, type FakePatient } from "./fake-patients";

// 1.7.5: one place for made-up people used in tests and local seeds. Never real patients.

export type FakeHistory = {
  allergies: string[];
  conditions: string[];
  notes: string;
};

const ALLERGIES = ["None known", "Penicillin (fake)", "Latex (fake)", "Lidocaine (fake)"];
const CONDITIONS = ["None", "Asthma (fake)", "Diabetes type 2 (fake)", "Hypertension (fake)"];
const NOTES = [
  "Prefers morning appointments (fake).",
  "Brought by parent (fake).",
  "Needs wheelchair access (fake).",
];

export function fakePatient(index = 0, seed = 1): FakePatient {
  const row = generateFakePatients(index + 1, seed)[index];
  if (!row) throw new Error("fakePatient: empty generator");
  return row;
}

export function fakeMobile(index = 0): string {
  return fakePatient(index).mobile;
}

export function fakePersonName(index = 0, seed = 1): { firstName: string; lastName: string } {
  const p = fakePatient(index, seed);
  return { firstName: p.firstName, lastName: p.lastName };
}

/** Made-up medical history strings for tests. Not clinical advice. */
export function fakeHistory(seed = 1): FakeHistory {
  const random = mulberry32(seed);
  return {
    allergies: [pick(ALLERGIES, random)],
    conditions: [pick(CONDITIONS, random)],
    notes: pick(NOTES, random),
  };
}

function pick(list: readonly string[], random: () => number): string {
  return list[Math.floor(random() * list.length)] ?? list[0]!;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
