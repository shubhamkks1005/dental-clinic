import { z } from "zod";
import { isFdiTooth } from "./teeth";

// B8: marks the doctor draws on an X-ray or photo. Coordinates are in the viewer's own space
// (x 0-400, y 0-300), so they do not depend on the screen size. Saved as one versioned JSON on the file.
export const ANNOTATION_W = 400;
export const ANNOTATION_H = 300;
export const ANNOTATION_MAX_ITEMS = 200;
export const ANNOTATION_MAX_BYTES = 65_536;

const x = z.number().min(0).max(ANNOTATION_W);
const y = z.number().min(0).max(ANNOTATION_H);
const base = {
  id: z.string().min(1).max(40),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Use a colour like #E11D48.")
    .optional(),
  // Line thickness the doctor chose (design: slider 1 to 8). Optional so older saved marks stay valid.
  width: z.number().min(0.5).max(8).optional(),
};

export const annotationItemSchema = z.discriminatedUnion("type", [
  z.object({
    ...base,
    type: z.literal("pen"),
    points: z
      .array(z.tuple([x, y]))
      .min(2)
      .max(400),
  }),
  z.object({
    ...base,
    type: z.literal("circle"),
    cx: x,
    cy: y,
    r: z.number().gt(0).max(ANNOTATION_W),
  }),
  z.object({ ...base, type: z.literal("arrow"), x1: x, y1: y, x2: x, y2: y }),
  z.object({ ...base, type: z.literal("text"), x, y, text: z.string().trim().min(1).max(200) }),
  z.object({ ...base, type: z.literal("measure"), x1: x, y1: y, x2: x, y2: y }),
]);

// Without a scale the measure shows viewer units only. The doctor sets the scale by drawing a line
// and typing its real length: mmPerUnit must equal knownMm / lineUnits (the server re-checks it).
export const annotationScaleSchema = z.object({
  mmPerUnit: z.number().gt(0).max(100),
  knownMm: z.number().gt(0).max(500),
  lineUnits: z.number().gt(0).max(500),
});

export const annotationsSchema = z
  .object({
    v: z.literal(1),
    scale: annotationScaleSchema.nullable(),
    items: z.array(annotationItemSchema).max(ANNOTATION_MAX_ITEMS, "Too many marks on one image."),
    // The viewer lets the doctor tag several teeth and write one note per image. Both optional
    // (older saves have neither); they live in this document, so no migration.
    teeth: z
      .array(z.number().int().refine(isFdiTooth, "Use a tooth number like 36."))
      .max(32, "Too many teeth on one image.")
      .optional(),
    note: z.string().trim().max(500, "The note is too long (500 letters at most).").optional(),
  })
  .strict()
  .superRefine((a, ctx) => {
    if (a.scale) {
      const expect = a.scale.knownMm / a.scale.lineUnits;
      if (Math.abs(a.scale.mmPerUnit - expect) > expect * 0.01) {
        ctx.addIssue({
          code: "custom",
          path: ["scale"],
          message: "The scale does not match the known length. Calibrate again.",
        });
      }
    }
    if (JSON.stringify(a).length > ANNOTATION_MAX_BYTES) {
      ctx.addIssue({ code: "custom", message: "Too many marks on one image." });
    }
  });

export type FileAnnotations = z.infer<typeof annotationsSchema>;
export type AnnotationItem = z.infer<typeof annotationItemSchema>;

export const saveAnnotationsBody = z
  .object({ version: z.number().int().positive(), annotations: annotationsSchema })
  .strict();

export function parseSaveAnnotations(body: unknown) {
  const parsed = saveAnnotationsBody.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the marks." };
  }
  return { ok: true as const, value: parsed.data };
}

/** What the doctor sees for a measure: mm once calibrated, viewer units before that. */
export function measureLength(
  m: { x1: number; y1: number; x2: number; y2: number },
  scale: FileAnnotations["scale"],
): { value: number; unit: "mm" | "px" } {
  const units = Math.hypot(m.x2 - m.x1, m.y2 - m.y1);
  return scale
    ? { value: Math.round(units * scale.mmPerUnit * 10) / 10, unit: "mm" }
    : { value: Math.round(units), unit: "px" };
}
