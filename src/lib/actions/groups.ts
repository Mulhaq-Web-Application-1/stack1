"use server";

import { revalidatePath } from "next/cache";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type GroupResult = { ok: true; id: string } | { ok: false; error: string };
export type GroupMemberResult = { ok: true } | { ok: false; error: string };

export async function createGroup(formData: FormData): Promise<GroupResult> {
  try {
    const user = await getOrCreateUser();
    const name = (formData.get("name") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() ?? null;
    const logoUrl = (formData.get("logoUrl") as string)?.trim() || null;
    const parentGroupId = (formData.get("parentGroupId") as string)?.trim() || null;

    if (!name) return { ok: false, error: "Name is required" };

    const group = await prisma.group.create({
      data: {
        name,
        description,
        logoUrl,
        parentGroupId,
      },
    });

    await prisma.groupMember.create({
      data: { userId: user.id, groupId: group.id, role: "admin" },
    });

    revalidatePath("/dashboard/groups");
    revalidatePath("/dashboard");
    return { ok: true, id: group.id };
  } catch (err) {
    console.error("Create group error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Create failed",
    };
  }
}

export async function updateGroup(
  groupId: string,
  formData: FormData
): Promise<GroupResult> {
  try {
    await getOrCreateUser();
    const name = (formData.get("name") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() ?? null;
    const logoUrl = (formData.get("logoUrl") as string)?.trim() || null;
    const parentGroupId = (formData.get("parentGroupId") as string)?.trim() || null;

    if (!name) return { ok: false, error: "Name is required" };

    await prisma.group.update({
      where: { id: groupId },
      data: {
        name,
        description,
        logoUrl,
        parentGroupId: parentGroupId || null,
      },
    });

    revalidatePath("/dashboard/groups");
    revalidatePath(`/dashboard/groups/${groupId}`);
    return { ok: true, id: groupId };
  } catch (err) {
    console.error("Update group error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Update failed",
    };
  }
}

export async function deleteGroup(groupId: string): Promise<GroupResult> {
  try {
    await getOrCreateUser();
    await prisma.group.delete({ where: { id: groupId } });
    revalidatePath("/dashboard/groups");
    revalidatePath("/dashboard");
    return { ok: true, id: groupId };
  } catch (err) {
    console.error("Delete group error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Delete failed",
    };
  }
}

export async function addMember(
  groupId: string,
  userId: string
): Promise<GroupMemberResult> {
  try {
    await getOrCreateUser();
    await prisma.groupMember.create({
      data: { userId, groupId, role: "member" },
    });
    revalidatePath(`/dashboard/groups/${groupId}`);
    revalidatePath("/dashboard/groups");
    return { ok: true };
  } catch (err) {
    console.error("Add member error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Add member failed",
    };
  }
}

export async function removeMember(
  groupId: string,
  userId: string
): Promise<GroupMemberResult> {
  try {
    const currentUser = await getOrCreateUser();
    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (!membership) return { ok: false, error: "Membership not found" };
    if (membership.userId === currentUser.id && membership.role === "admin") {
      const otherAdmins = await prisma.groupMember.count({
        where: { groupId, role: "admin" },
      });
      if (otherAdmins <= 1) {
        return { ok: false, error: "Cannot leave: add another admin first" };
      }
    }
    await prisma.groupMember.delete({
      where: { userId_groupId: { userId, groupId } },
    });
    revalidatePath(`/dashboard/groups/${groupId}`);
    revalidatePath("/dashboard/groups");
    return { ok: true };
  } catch (err) {
    console.error("Remove member error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Remove failed",
    };
  }
}

export async function setGroupLogoUrl(
  groupId: string,
  url: string | null
): Promise<GroupResult> {
  try {
    await getOrCreateUser();
    await prisma.group.update({
      where: { id: groupId },
      data: { logoUrl: url },
    });
    revalidatePath("/dashboard/groups");
    revalidatePath(`/dashboard/groups/${groupId}`);
    return { ok: true, id: groupId };
  } catch (err) {
    console.error("Set group logo error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Update failed",
    };
  }
}
