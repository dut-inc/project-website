// Photo handling for Field Watch sightings: client-side compression to blob, upload to db
import type { SupabaseClient } from "@supabase/supabase-js";

// Hard cap for a compressed photo.
export const MAX_PHOTO_BYTES = 512 * 1024;

const BUCKET = "sightings-photos";

/**
 * Draw a photo file onto a canvas: keeps aspect ratio, caps the long edge, and
 * fills any transparency with white before JPEG encoding.
 */
function drawToCanvas(file: File, maxDimension: number): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      try {
        const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas is unavailable in this browser.");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas);
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read that image file."));
    };

    image.src = objectUrl;
  });
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode that photo."))),
      "image/jpeg",
      quality,
    );
  });
}

/**
 * Compress a photo file to a JPEG Blob: resize to 1200px at quality 0.82, and
 * if that still exceeds MAX_PHOTO_BYTES, re-encode smaller (1000px, 0.7).
 * Photos that remain over the cap are rejected with an error message.
 */
export async function compressForUploadBlob(file: File): Promise<Blob> {
  let blob = await canvasToJpeg(await drawToCanvas(file, 1200), 0.82);
  if (blob.size > MAX_PHOTO_BYTES) {
    blob = await canvasToJpeg(await drawToCanvas(file, 1000), 0.7);
  }
  if (blob.size > MAX_PHOTO_BYTES) {
    throw new Error(
      `That photo is too detailed to fit under ${MAX_PHOTO_BYTES / 1024}KB even after compression. Try a different shot.`,
    );
  }
  return blob;
}

/** Upload a compressed photo to the sightings-photos bucket. */
export async function uploadSightingPhoto(
  supabase: SupabaseClient,
  path: string,
  blob: Blob,
): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) throw error;
}

/** Public URL for a photo already in the bucket. */
export function sightingPhotoUrl(supabase: SupabaseClient, path: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
