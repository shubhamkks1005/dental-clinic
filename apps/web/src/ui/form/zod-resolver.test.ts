import { displayDateField, mobileField, personNameField } from "@clinic/shared";
import type { ResolverOptions } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { zodResolver } from "./zod-resolver";

const schema = z.object({
  name: personNameField,
  mobile: mobileField,
  birthDate: displayDateField,
  address: z.object({ city: z.string().min(1, "Enter the city.") }),
});
const options = {} as ResolverOptions<z.input<typeof schema>>;
const resolve = (values: z.input<typeof schema>) => zodResolver(schema)(values, undefined, options);

describe("form kit: zod resolver (1.4.4)", () => {
  it("valid input comes back normalised (mobile +91..., date YYYY-MM-DD)", async () => {
    const result = await resolve({
      name: "  Meena   Test ",
      mobile: "98765 43210",
      birthDate: "5/8/1990",
      address: { city: "Jhansi" },
    });
    expect(result).toEqual({
      values: {
        name: "Meena Test",
        mobile: "+919876543210",
        birthDate: "1990-08-05",
        address: { city: "Jhansi" },
      },
      errors: {},
    });
  });

  it("each bad field gets one plain message, nested fields too", async () => {
    const result = await resolve({
      name: "",
      mobile: "12345",
      birthDate: "31/04/2026",
      address: { city: "" },
    });
    expect(result.values).toEqual({});
    expect(result.errors).toMatchObject({
      name: { message: "Enter the name." },
      mobile: { message: "Enter a 10-digit mobile number that starts with 6, 7, 8 or 9." },
      birthDate: { message: "Enter the date as DD/MM/YYYY, for example 05/08/1990." },
      address: { city: { message: "Enter the city." } },
    });
  });
});
