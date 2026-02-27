"use server";

import { revalidatePath } from "next/cache";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFromR2, extractR2Key, isR2Configured } from "@/lib/r2";

export type GroupResult = { ok: true; id: string } | { ok: false; error: string };
export type GroupMemberResult = { ok: true } | { ok: false; error: string };

export async function createGroup(formData: FormData): Promise<GroupResult> {
  try {
    const user = await getOrCreateUser();
    const userId = user?.id;
    if (!userId) {
      return { ok: false, error: "Please sign in to create a group." };
    }

    const name = (formData.get("name") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() ?? null;
    const logoUrl = (formData.get("logoUrl") as string)?.trim() || null;
    const parentGroupId = (formData.get("parentGroupId") as string)?.trim() || null;

    if (!name) return { ok: false, error: "Name is required" };
    if (name.length > 100) return { ok: false, error: "Name must be 100 characters or less" };
    if (description && description.length > 500) return { ok: false, error: "Description must be 500 characters or less" };

    const group = await prisma.$transaction(async (tx) => {
      const g = await tx.group.create({
        data: {
          name,
          description: description ?? null,
          logoUrl: logoUrl ?? null,
          parentGroupId: parentGroupId || null,
        },
      });
      await tx.groupMember.create({
        data: { userId, groupId: g.id, role: "admin" },
      });
      return g;
    });

    revalidatePath("/dashboard/groups");
    revalidatePath("/dashboard");
    return { ok: true, id: group.id };
  } catch (err) {
    console.error("Create group error:", err);
    const message = err instanceof Error ? err.message : "Create failed";
    return { ok: false, error: message };
  }
}

export async function updateGroup(
  groupId: string,
  formData: FormData
): Promise<GroupResult> {
  try {
    const user = await getOrCreateUser();
    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId: user.id, role: "admin" },
    });
    if (!membership) return { ok: false, error: "Not authorized" };

    const name = (formData.get("name") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() ?? null;
    const logoUrl = (formData.get("logoUrl") as string)?.trim() || null;
    const parentGroupId = (formData.get("parentGroupId") as string)?.trim() || null;

    if (!name) return { ok: false, error: "Name is required" };
    if (name.length > 100) return { ok: false, error: "Name must be 100 characters or less" };
    if (description && description.length > 500) return { ok: false, error: "Description must be 500 characters or less" };

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
    const user = await getOrCreateUser();
    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId: user.id, role: "admin" },
    });
    if (!membership) return { ok: false, error: "Not authorized" };

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    await prisma.group.delete({ where: { id: groupId } });

    if (group?.logoUrl && isR2Configured()) {
      const key = extractR2Key(group.logoUrl);
      if (key) await deleteFromR2(key).catch(() => {});
    }

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
    const caller = await getOrCreateUser();
    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId: caller.id, role: "admin" },
    });
    if (!membership) return { ok: false, error: "Not authorized" };

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
    const callerMembership = await prisma.groupMember.findFirst({
      where: { groupId, userId: currentUser.id, role: "admin" },
    });
    if (!callerMembership) return { ok: false, error: "Not authorized" };

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
    const user = await getOrCreateUser();
    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId: user.id, role: "admin" },
    });
    if (!membership) return { ok: false, error: "Not authorized" };

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
