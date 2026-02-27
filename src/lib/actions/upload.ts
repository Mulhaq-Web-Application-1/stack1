"use server";

import { getOrCreateUser } from "@/lib/auth";
import {
  uploadToR2,
  validateImageFile,
  getR2KeyForImage,
  getPublicUrlForKey,
  isR2Configured,
} from "@/lib/r2";

export type UploadImageResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/** Upload an image to R2 and return the public URL. Used for profile, group logo, page cover. */
export async function uploadImage(
  formData: FormData,
  prefix: "profile" | "group" | "page",
  identifier: string
): Promise<UploadImageResult> {
  try {
    const user = await getOrCreateUser();
    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) {
      return { ok: false, error: "No file provided" };
    }

    const validation = validateImageFile(file);
    if (!validation.ok) {
      return { ok: false, error: validation.error ?? "Invalid image" };
    }

    if (!isR2Configured()) {
      return { ok: false, error: "Storage is not configured" };
    }

    const key = getR2KeyForImage(prefix, identifier, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToR2(key, buffer, file.type);

    const url = getPublicUrlForKey(key);
    return { ok: true, url };
  } catch (err) {
    console.error("Upload image error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Upload failed",
    };
  }
}
