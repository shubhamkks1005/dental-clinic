import { describe, expect, it } from "vitest";
import {
  allergyRows,
  buildSaveItems,
  CURRENT_MEDICINES_CODE,
  rowsFromHistoryItems,
} from "./checklist";

describe("medical history checklist helpers (3.3.1)", () => {
  it("maps list items and allergens into form rows", () => {
    const rows = rowsFromHistoryItems([
      {
        id: "1",
        label: "Diabetes",
        data: { code: "diabetes", section: "conditions", alert_label: "Diabetes", restricted: "" },
        active: true,
        sortOrder: 1,
        version: 1,
      },
    ]);
    expect(rows[0]).toEqual({
      code: "diabetes",
      label: "Diabetes",
      section: "conditions",
      alertLabel: "Diabetes",
      restricted: false,
    });
    expect(
      allergyRows([
        { id: "a1", label: "Latex", data: {}, active: true, sortOrder: 1, version: 1 },
      ])[0]?.code,
    ).toBe("allergy:a1");
  });

  it("builds save payload with alert labels only on Yes and optional medicines note", () => {
    const items = buildSaveItems(
      [
        {
          code: "diabetes",
          label: "Diabetes",
          section: "conditions",
          alertLabel: "Diabetes",
          restricted: false,
        },
        {
          code: "hepatitis",
          label: "Hepatitis",
          section: "conditions",
          alertLabel: "Doctor to check",
          restricted: true,
        },
      ],
      { diabetes: "yes", hepatitis: "no" },
      {},
      "Fake vitamin D",
    );
    expect(items.find((i) => i.code === "diabetes")?.alertLabel).toBe("Diabetes");
    expect(items.find((i) => i.code === "hepatitis")?.alertLabel).toBeNull();
    expect(items.find((i) => i.code === CURRENT_MEDICINES_CODE)?.note).toBe("Fake vitamin D");
  });
});
