// Made-up data for local development and tests only. Never real patients.
// Mobiles are a patterned fake range; they may only be used with MESSAGING_MODE=dry_run.

export type FakePatient = {
  code: string;
  firstName: string;
  lastName: string;
  mobile: string;
};

const FIRST_NAMES = [
  "Aarav",
  "Aditi",
  "Akash",
  "Ananya",
  "Arjun",
  "Bhavna",
  "Chetan",
  "Deepa",
  "Farhan",
  "Gauri",
  "Harish",
  "Isha",
  "Jatin",
  "Kavya",
  "Lalit",
  "Meera",
  "Naveen",
  "Neha",
  "Omkar",
  "Pooja",
  "Rahul",
  "Riya",
  "Sameer",
  "Sana",
  "Tarun",
  "Usha",
  "Varun",
  "Vidya",
  "Yash",
  "Zoya",
];

const LAST_NAMES = [
  "Agarwal",
  "Bansal",
  "Chauhan",
  "Das",
  "Gupta",
  "Iyer",
  "Joshi",
  "Khan",
  "Mehta",
  "Nair",
  "Patel",
  "Rao",
  "Reddy",
  "Saxena",
  "Sharma",
  "Singh",
  "Thakur",
  "Verma",
  "Yadav",
  "Zaidi",
];

const FAKE_MOBILE_START = 9_000_000_000;

export function generateFakePatients(count = 5000, seed = 1): FakePatient[] {
  const random = mulberry32(seed);
  return Array.from({ length: count }, (_, i) => ({
    code: `P-${String(i + 1).padStart(6, "0")}`,
    firstName: pick(FIRST_NAMES, random),
    lastName: pick(LAST_NAMES, random),
    mobile: String(FAKE_MOBILE_START + i),
  }));
}

function pick(list: readonly string[], random: () => number): string {
  return list[Math.floor(random() * list.length)] ?? list[0]!;
}

// Small seeded PRNG so the same seed always gives the same people.
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
