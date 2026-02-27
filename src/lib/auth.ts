import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export type DbUser = {
  id: string;
  clerkUserId: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  profileImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/** Get current user from DB, creating from Clerk if needed. Throws if not signed in. */
export async function getOrCreateUser(): Promise<DbUser> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const clerkUser = await (await import("@clerk/nextjs/server")).currentUser();
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? null;
  const name = clerkUser
    ? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null
    : null;
  const phone = clerkUser?.phoneNumbers?.[0]?.phoneNumber ?? null;

  let user = await prisma.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkUserId: userId,
        email: email ?? undefined,
        name: name ?? undefined,
        phone: phone ?? undefined,
      },
    });
  } else {
    // Sync name/email/phone from Clerk when they might have changed
    if (user.name !== name || user.email !== email || user.phone !== phone) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name ?? undefined,
          email: email ?? undefined,
          phone: phone ?? undefined,
        },
      });
    }
  }
  return user as DbUser;
}

/** Get current user or null (does not create). */
export async function getCurrentUser(): Promise<DbUser | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { clerkUserId: userId } });
  return user as DbUser | null;
}
