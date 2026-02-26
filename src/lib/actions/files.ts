"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  uploadToR2,
  deleteFromR2,
  validateFile,
  getR2Key,
  R2_BUCKET,
} from "@/lib/r2";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

async function getOrCreateUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const clerkUser = await (await import("@clerk/nextjs/server")).currentUser();
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? null;

  let user = await prisma.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) {
    user = await prisma.user.create({
      data: { clerkUserId: userId, email: email ?? undefined },
    });
  }
  return user;
}

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
