"use server";

import { revalidatePath } from "next/cache";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type PageResult = { ok: true; id: string } | { ok: false; error: string };

export async function createPage(
  groupId: string,
  formData: FormData
): Promise<PageResult> {
  try {
    await getOrCreateUser();
    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() ?? null;
    const coverPhotoUrl = (formData.get("coverPhotoUrl") as string)?.trim() || null;
    const parentGroupLogoUrl = (formData.get("parentGroupLogoUrl") as string)?.trim() || null;
    const childGroupLogoUrl = (formData.get("childGroupLogoUrl") as string)?.trim() || null;

    if (!title) return { ok: false, error: "Title is required" };

    const page = await prisma.page.create({
      data: {
        groupId,
        title,
        description,
        coverPhotoUrl,
        parentGroupLogoUrl,
        childGroupLogoUrl,
      },
    });

    revalidatePath(`/dashboard/groups/${groupId}`);
    revalidatePath(`/dashboard/groups/${groupId}/pages`);
    return { ok: true, id: page.id };
  } catch (err) {
    console.error("Create page error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Create failed",
    };
  }
}

export async function updatePage(
  pageId: string,
  formData: FormData
): Promise<PageResult> {
  try {
    await getOrCreateUser();
    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() ?? null;
    const coverPhotoUrl = (formData.get("coverPhotoUrl") as string)?.trim() || null;
    const parentGroupLogoUrl = (formData.get("parentGroupLogoUrl") as string)?.trim() || null;
    const childGroupLogoUrl = (formData.get("childGroupLogoUrl") as string)?.trim() || null;

    if (!title) return { ok: false, error: "Title is required" };

    const page = await prisma.page.update({
      where: { id: pageId },
      data: {
        title,
        description,
        coverPhotoUrl,
        parentGroupLogoUrl,
        childGroupLogoUrl,
      },
    });

    revalidatePath(`/dashboard/groups/${page.groupId}`);
    revalidatePath(`/dashboard/groups/${page.groupId}/pages`);
    revalidatePath(`/dashboard/groups/${page.groupId}/pages/${pageId}`);
    return { ok: true, id: pageId };
  } catch (err) {
    console.error("Update page error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Update failed",
    };
  }
}

export async function deletePage(pageId: string): Promise<PageResult> {
  try {
    const user = await getOrCreateUser();
    const page = await prisma.page.findUnique({ where: { id: pageId } });
    if (!page) return { ok: false, error: "Page not found" };
    await prisma.page.delete({ where: { id: pageId } });
    revalidatePath(`/dashboard/groups/${page.groupId}`);
    revalidatePath(`/dashboard/groups/${page.groupId}/pages`);
    return { ok: true, id: pageId };
  } catch (err) {
    console.error("Delete page error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Delete failed",
    };
  }
}

export async function setPageCoverUrl(
  pageId: string,
  url: string | null
): Promise<PageResult> {
  try {
    await getOrCreateUser();
    const page = await prisma.page.update({
      where: { id: pageId },
      data: { coverPhotoUrl: url },
    });
    revalidatePath(`/dashboard/groups/${page.groupId}`);
    revalidatePath(`/dashboard/groups/${page.groupId}/pages`);
    revalidatePath(`/dashboard/groups/${page.groupId}/pages/${pageId}`);
    revalidatePath(`/dashboard/groups/${page.groupId}/pages/${pageId}/edit`);
    return { ok: true, id: pageId };
  } catch (err) {
    console.error("Set page cover error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Update failed",
    };
  }
}
