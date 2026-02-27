import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export type DbUser = {
  id: string;
  clerkUserId: string;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/** Get current user from DB, creating from Clerk if needed. Throws if not signed in. */
export async function getOrCreateUser(): Promise<DbUser> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const clerkUser = await (await import("@clerk/nextjs/server")).currentUser();
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? null;

  let user = await prisma.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkUserId: userId,
        email: email ?? undefined,
      },
    });
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
