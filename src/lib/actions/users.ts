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
    const name = (formData.get("name") as string)?.trim() ?? null;
    const phone = (formData.get("phone") as string)?.trim() ?? null;
    const email = (formData.get("email") as string)?.trim() ?? null;
    const profilePictureUrl = (formData.get("profilePictureUrl") as string)?.trim() || null;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name || null,
        phone: phone || null,
        email: email || null,
        profilePictureUrl: profilePictureUrl || null,
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

export async function setProfilePictureUrl(url: string | null): Promise<UpdateProfileResult> {
  try {
    const user = await getOrCreateUser();
    await prisma.user.update({
      where: { id: user.id },
      data: { profilePictureUrl: url },
    });
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
