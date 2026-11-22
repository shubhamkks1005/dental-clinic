// Made-up data for local development and tests only. Never real patients.
// Mobiles are a patterned fake range; they may only be used with MESSAGING_MODE=dry_run.
// Keep genders in sync with PATIENT_GENDERS in @clinic/shared (no import: seed script runs under bare Node).

const GENDERS = ["female", "male", "other"] as const;
type FakeGender = (typeof GENDERS)[number];

export type FakePatient = {
  /** Deterministic primary key for local seed rows (id LIKE 'seed%'). */
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: FakeGender;
  /** Years at registration; DOB left null so age display (2.1.4) uses this path. */
  ageYearsAtReg: number;
  /** Ten digits in the fake range 9000000000… (not stored form). */
  mobile: string;
  /** Stored form +91XXXXXXXXXX. */
  mobileE164: string;
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
  return Array.from({ length: count }, (_, i) => {
    const firstName = pick(FIRST_NAMES, random);
    const lastName = pick(LAST_NAMES, random);
    const mobile = String(FAKE_MOBILE_START + i);
    return {
      id: seedPatientId(i + 1),
      code: `P-${String(i + 1).padStart(6, "0")}`,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      gender: GENDERS[i % GENDERS.length]!,
      ageYearsAtReg: 5 + (i % 90),
      mobile,
      mobileE164: `+91${mobile}`,
    };
  });
}

/** Stable 26-char ids so re-seed can DELETE WHERE id LIKE 'seed%'. */
export function seedPatientId(oneBasedIndex: number): string {
  return `seed${String(oneBasedIndex).padStart(22, "0")}`;
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
