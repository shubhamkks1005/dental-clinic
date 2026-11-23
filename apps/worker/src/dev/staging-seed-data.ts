// Fake people for the staging seed. Obviously fake: last name "Testcase", phones 90000 00xxx.
// Never real patients.

export const SEED_MARKER = "STAGING-SEED fake data";

const FIRST = [
  "Asha",
  "Bharat",
  "Chitra",
  "Dev",
  "Esha",
  "Farhan",
  "Gita",
  "Harsh",
  "Indu",
  "Jai",
  "Kiran",
  "Lata",
  "Manoj",
  "Neha",
  "Om",
  "Pooja",
  "Qadir",
  "Rita",
  "Sunil",
  "Tara",
  "Uma",
  "Vikram",
  "Wasim",
  "Yash",
  "Zoya",
  "Anil",
  "Bina",
  "Chetan",
  "Disha",
  "Ehsan",
];

export type SeedPerson = {
  fullName: string;
  gender: "male" | "female";
  mobile: string;
  ageYearsAtReg: number;
  guardianName?: string;
  guardianRelation?: string;
  guardianMobile?: string;
};

/** 30 people. #4..#7 are children with a guardian. #29 repeats #28 (duplicate-warning case). */
export function seedPeople(): SeedPerson[] {
  const people: SeedPerson[] = [];
  for (let i = 0; i < 30; i++) {
    const dup = i === 29;
    const base = dup ? 28 : i;
    const child = i >= 4 && i <= 7;
    const guardianMobile = `90000${String(500 + i).padStart(5, "0")}`;
    people.push({
      fullName: `${FIRST[base]} Testcase`,
      gender: base % 2 === 0 ? "female" : "male",
      mobile: dup
        ? `90000${String(100 + 28).padStart(5, "0")}`
        : `90000${String(100 + i).padStart(5, "0")}`,
      ageYearsAtReg: child ? 6 + (i - 4) * 2 : 25 + ((i * 7) % 40),
      ...(child
        ? {
            guardianName: `${FIRST[(i + 10) % 30]} Testcase`,
            guardianRelation: "Mother",
            guardianMobile,
          }
        : {}),
    });
  }
  return people;
}
