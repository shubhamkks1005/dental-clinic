// Library Q4 (2026-11-25): bundled name suggestions shown under the name field while typing.
// Names only, matching only (nothing on focus), never fees. Fake starter data.
// DRAFT: doctor reviews before pilot.

export const SUGGESTION_FIELDS = [
  "medicines",
  "procedures",
  "visit_types",
  "diagnoses",
  "quick_phrases",
  "referral_sources",
] as const;
export type SuggestionField = (typeof SUGGESTION_FIELDS)[number];

const LISTS: Record<SuggestionField, readonly string[]> = {
  // DRAFT: doctor reviews before pilot
  medicines: [
    "Amoxicillin + Clavulanic Acid",
    "Azithromycin",
    "Cefixime",
    "Metronidazole",
    "Ofloxacin + Ornidazole",
    "Ketorolac Tromethamine",
    "Aceclofenac + Paracetamol",
    "Diclofenac + Serratiopeptidase",
    "Paracetamol",
    "Pantoprazole",
    "Chlorhexidine Gluconate",
    "Choline Salicylate + Lignocaine",
    "Tranexamic Acid",
    "Doxycycline",
    "Ibuprofen",
    "Clindamycin",
  ],
  // DRAFT: doctor reviews before pilot
  procedures: [
    "Scaling and polishing",
    "Composite filling",
    "Root canal treatment",
    "Extraction",
    "Surgical extraction",
    "Crown",
    "Bridge",
    "Implant",
    "Teeth whitening",
    "Fluoride application",
    "Pit and fissure sealant",
    "Denture",
    "Orthodontic consultation",
  ],
  // DRAFT: doctor reviews before pilot
  visit_types: [
    "Consultation",
    "Follow-up",
    "Emergency",
    "Root canal sitting",
    "Cleaning",
    "Crown fitting",
    "Review",
  ],
  // DRAFT: doctor reviews before pilot
  diagnoses: [
    "Dental caries",
    "Irreversible pulpitis",
    "Reversible pulpitis",
    "Periapical abscess",
    "Chronic gingivitis",
    "Chronic periodontitis",
    "Dentin hypersensitivity",
    "Impacted third molar",
    "Fractured tooth",
    "Missing tooth",
  ],
  // DRAFT: doctor reviews before pilot
  quick_phrases: [
    "Scaling done",
    "Post-extraction advice",
    "Review after a week",
    "Soft diet",
    "Warm saline rinse",
  ],
  // DRAFT: doctor reviews before pilot
  referral_sources: [
    "Friend or family",
    "Google",
    "Walk-in",
    "Another doctor",
    "Social media",
    "Signboard",
  ],
};

export const SUGGESTION_LIMIT = 8;

/** Up to 8 names that contain the typed text (case-insensitive); [] when nothing is typed. */
export function suggest(field: SuggestionField, typed: string): string[] {
  const want = typed.trim().toLowerCase();
  if (!want) return [];
  return LISTS[field].filter((n) => n.toLowerCase().includes(want)).slice(0, SUGGESTION_LIMIT);
}

export const isSuggestionField = (key: string): key is SuggestionField =>
  (SUGGESTION_FIELDS as readonly string[]).includes(key);
