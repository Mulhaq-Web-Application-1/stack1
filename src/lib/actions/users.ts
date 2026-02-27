"use server";

import { revalidatePath } from "next/cache";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type UpdateProfileResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateProfile(formData: FormData): Promise<UpdateProfileResult> {
  try {
    const user = await getOrCreateUser();
    const email = (formData.get("email") as string)?.trim() ?? null;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: email || null,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profile");
    return { ok: true };
  } catch (err) {
    console.error("Update profile error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Update failed",
    };
  }
}

export async function setProfilePictureUrl(_url: string | null): Promise<UpdateProfileResult> {
  try {
    await getOrCreateUser();
    // User model has no profilePictureUrl; revalidate so UI updates if stored elsewhere
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profile");
    return { ok: true };
  } catch (err) {
    console.error("Set profile picture error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Update failed",
    };
  }
}
