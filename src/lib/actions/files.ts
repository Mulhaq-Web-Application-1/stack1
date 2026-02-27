"use server";

import { revalidatePath } from "next/cache";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  uploadToR2,
  deleteFromR2,
  validateFile,
  getR2Key,
  getPublicUrlForKey,
  R2_BUCKET,
} from "@/lib/r2";

export type UploadResult = { ok: true; fileId: string } | { ok: false; error: string };

export async function uploadFile(formData: FormData): Promise<UploadResult> {
  try {
    const user = await getOrCreateUser();
    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) {
      return { ok: false, error: "No file provided" };
    }

    const validation = validateFile(file);
    if (!validation.ok) return { ok: false, error: validation.error ?? "Invalid file" };

    if (!R2_BUCKET) {
      return { ok: false, error: "Storage is not configured" };
    }

    const key = getR2Key(user.id, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToR2(key, buffer, file.type);

    const publicUrl = process.env.R2_PUBLIC_URL
      ? `${process.env.R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`
      : `/api/files/${key}`;

    const record = await prisma.file.create({
      data: {
        name: file.name,
        url: publicUrl,
        size: file.size,
        key,
        userId: user.id,
      },
    });

    revalidatePath("/dashboard");
    return { ok: true, fileId: record.id };
  } catch (err) {
    console.error("Upload error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Upload failed",
    };
  }
}

/** Called after a presigned-URL upload completes client-side. Creates the DB record. */
export async function confirmUpload(
  key: string,
  name: string,
  size: number,
  contentType: string
): Promise<UploadResult> {
  try {
    const user = await getOrCreateUser();

    // Verify the key belongs to this user
    if (!key.startsWith(`uploads/${user.id}/`)) {
      return { ok: false, error: "Invalid upload key" };
    }

    const url = getPublicUrlForKey(key);

    const record = await prisma.file.create({
      data: { name, url, size, key, userId: user.id },
    });

    revalidatePath("/dashboard");
    return { ok: true, fileId: record.id };
  } catch (err) {
    console.error("Confirm upload error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Confirm failed",
    };
  }
}

export type DeleteResult = { ok: true } | { ok: false; error: string };

export async function deleteFile(fileId: string): Promise<DeleteResult> {
  try {
    const user = await getOrCreateUser();
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId: user.id },
    });
    if (!file) return { ok: false, error: "File not found" };

    if (R2_BUCKET) {
      await deleteFromR2(file.key);
    }
    await prisma.file.delete({ where: { id: fileId } });
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    console.error("Delete error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Delete failed",
    };
  }
}
