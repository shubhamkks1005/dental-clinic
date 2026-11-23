import { SAMPLE_RX, type SampleRx } from "./sample-print-data";

const FAKE_MEDS = [
  { name: "Tab. Fake Amox 500 mg", note: "After food", frequency: "1-0-1", duration: "5 days" },
  { name: "Tab. Fake Ibu 400 mg", note: "If pain", frequency: "1-0-1", duration: "3 days" },
  { name: "Mouthwash Fake", note: "10 ml rinse", frequency: "0-0-1", duration: "7 days" },
  { name: "Gel Fake Oral", note: "Thin layer", frequency: "1-1-1", duration: "5 days" },
  { name: "Tab. Fake Vit C", note: "After food", frequency: "1-0-0", duration: "10 days" },
  { name: "Cap. Fake Probiotic", note: "Before food", frequency: "0-0-1", duration: "7 days" },
  { name: "Tab. Fake Antacid", note: "After food", frequency: "1-0-1", duration: "5 days" },
  { name: "Syp. Fake Cough", note: "5 ml", frequency: "1-1-1", duration: "3 days" },
] as const;

/** 4.5.1: sample Rx with 1..8 fake medicine lines for print regression. */
export function sampleRxWithMedicineCount(count: number): SampleRx {
  const n = Math.min(8, Math.max(1, Math.floor(count)));
  return {
    ...SAMPLE_RX,
    medicines: FAKE_MEDS.slice(0, n).map((m) => ({ ...m })),
  };
}

export function parseMedicineLineCount(raw: string | null | undefined): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  if (n < 1 || n > 8) return null;
  return n;
}
