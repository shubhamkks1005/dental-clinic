import { fail, ok, parseFileUploadMeta } from "@clinic/shared";
import { Hono } from "hono";
import { StorageNotConfiguredError } from "../adapters/storage";
import { storageFromEnv } from "../adapters/storage-from-env";
import {
  getFileAnnotations,
  getPatientFile,
  listPatientFiles,
  readFileBytes,
  saveFileAnnotations,
  softDeletePatientFile,
  storageUsageBytes,
  uploadFile,
} from "../domain/files";
import { signedIn } from "../http";
import type { AppEnv } from "../types";

export const staffFiles = new Hono<AppEnv>();

staffFiles.get("/storage/usage", async (c) => {
  const bytes = await storageUsageBytes(signedIn(c).repos);
  return c.json(ok({ bytes }));
});

staffFiles.get("/patients/:id/files", async (c) => {
  const rows = await listPatientFiles(signedIn(c).repos, c.req.param("id"));
  return c.json(ok({ files: rows }));
});

staffFiles.post("/patients/:id/files", async (c) => {
  const { repos } = signedIn(c);
  // Permission before parsing/storage so denied roles get 403 (route matrix).
  repos.files.assertCanAccessFiles();

  let storage;
  try {
    storage = storageFromEnv(c.env);
  } catch (err) {
    if (err instanceof StorageNotConfiguredError) {
      return c.json(fail("not_configured", err.message), 503);
    }
    throw err;
  }

  const body = await c.req.parseBody({ all: true });
  const filePart = body.file;
  if (!(filePart instanceof File)) {
    return c.json(fail("invalid", "Attach a file in the file field."), 400);
  }
  const meta = parseFileUploadMeta({
    kind: body.kind,
    caption: emptyToUndef(body.caption),
    toothFdi:
      body.toothFdi === undefined || body.toothFdi === "" ? undefined : Number(body.toothFdi),
    takenOn: emptyToUndef(body.takenOn),
  });
  if (!meta.ok) return c.json(fail("invalid", meta.message), 400);

  const bytes = new Uint8Array(await filePart.arrayBuffer());
  const mime = filePart.type || "application/octet-stream";
  const thumbPart = body.thumb;
  let thumbBytes: Uint8Array | null = null;
  let thumbMime: string | null = null;
  if (thumbPart instanceof File) {
    thumbBytes = new Uint8Array(await thumbPart.arrayBuffer());
    thumbMime = thumbPart.type || "image/jpeg";
  }
  const row = await uploadFile(repos, storage, {
    patientId: c.req.param("id"),
    bytes,
    mime,
    originalFilename: filePart.name || "upload",
    thumbBytes,
    thumbMime,
    ...meta.value,
  });
  return c.json(ok({ file: row }), 201);
});

staffFiles.get("/files/:id", async (c) => {
  const { repos } = signedIn(c);
  repos.files.assertCanAccessFiles();
  const file = await getPatientFile(repos, c.req.param("id"));
  return c.json(ok({ file }));
});

staffFiles.get("/files/:id/content", async (c) => {
  const { repos } = signedIn(c);
  repos.files.assertCanAccessFiles();

  let storage;
  try {
    storage = storageFromEnv(c.env);
  } catch (err) {
    if (err instanceof StorageNotConfiguredError) {
      return c.json(fail("not_configured", err.message), 503);
    }
    throw err;
  }
  const wantThumb = c.req.query("thumb") === "1";
  const { row, body, contentType } = await readFileBytes(repos, storage, c.req.param("id"), {
    thumb: wantThumb,
  });
  const headers = new Headers({
    "content-type": contentType,
    "content-disposition": `inline; filename="${safeFilename(row.originalFilename)}"`,
  });
  return new Response(body, { status: 200, headers });
});

// B8: marks on an X-ray or photo (doctor only).
staffFiles.get("/files/:id/annotations", async (c) => {
  return c.json(ok(await getFileAnnotations(signedIn(c).repos, c.req.param("id"))));
});

staffFiles.put("/files/:id/annotations", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await saveFileAnnotations(signedIn(c).repos, c.req.param("id"), body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok(result.saved));
});

staffFiles.delete("/files/:id", async (c) => {
  const { repos } = signedIn(c);
  repos.files.assertCanAccessFiles();
  await softDeletePatientFile(repos, c.req.param("id"));
  return c.json(ok({ deleted: true }));
});

function emptyToUndef(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length ? t : undefined;
}

function safeFilename(name: string): string {
  return name.replace(/[^\w.\- ()[\]]+/g, "_").slice(0, 120) || "file";
}
