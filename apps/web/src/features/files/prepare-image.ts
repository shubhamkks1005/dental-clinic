import {
  canMakeImageThumb,
  fitWithin,
  PHOTO_JPEG_QUALITY,
  PHOTO_MAX_EDGE,
  shouldRecompressOriginal,
  THUMB_MAX_EDGE,
} from "./prepare-size";

export type PreparedUpload = {
  /** Main object to upload (may be original or recompressed photo). */
  file: File;
  /** Optional 300 px JPEG thumbnail bytes (null for PDF / unloadable). */
  thumb: Blob | null;
  /** True when the main file was recompressed in the browser. */
  recompressed: boolean;
};

/**
 * 3.7.3: phone photos → max 2000 px edge, JPEG 85%; X-rays unchanged; thumbs at 300 px.
 * HEIC is not supported — ask staff to use JPEG on the camera.
 */
export async function prepareImageForUpload(file: File, kind: string): Promise<PreparedUpload> {
  if (!canMakeImageThumb(file.type)) {
    return { file, thumb: null, recompressed: false };
  }

  const bitmap = await loadBitmap(file);
  if (!bitmap) {
    return { file, thumb: null, recompressed: false };
  }

  try {
    const thumb = await drawToJpeg(bitmap, THUMB_MAX_EDGE, PHOTO_JPEG_QUALITY);
    if (!shouldRecompressOriginal(kind)) {
      return { file, thumb, recompressed: false };
    }
    const main = await drawToJpeg(bitmap, PHOTO_MAX_EDGE, PHOTO_JPEG_QUALITY);
    const out = new File([main], jpegName(file.name), {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
    return { file: out, thumb, recompressed: true };
  } finally {
    bitmap.close();
  }
}

async function loadBitmap(file: File): Promise<ImageBitmap | null> {
  try {
    return await createImageBitmap(file);
  } catch {
    return null;
  }
}

async function drawToJpeg(source: ImageBitmap, maxEdge: number, quality: number): Promise<Blob> {
  const size = fitWithin(source.width, source.height, maxEdge);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare the image.");
  ctx.drawImage(source, 0, 0, size.width, size.height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) throw new Error("Could not compress the image.");
  return blob;
}

function jpegName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "") || "photo";
  return `${base}.jpg`;
}
