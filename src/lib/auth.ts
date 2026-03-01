import { auth } from "@clerk/nextjs/server";
import { cache } from "react";
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

/**
 * Get current user from DB, creating from Clerk only on first sign-in.
 * Wrapped in React cache() — multiple Server Components calling this in the
 * same render share a single DB round-trip (no duplicate queries or Clerk calls).
 * Profile sync (name/email changes) should be handled via Clerk webhooks.
 */
export const getOrCreateUser = cache(async (): Promise<DbUser> => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const existing = await prisma.user.findUnique({ where: { clerkUserId: userId } });
  if (existing) return existing as DbUser;

  // First sign-in only: fetch Clerk profile to seed the DB row
  const { currentUser } = await import("@clerk/nextjs/server");
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? null;
  const name = clerkUser
    ? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null
    : null;
  const phone = clerkUser?.phoneNumbers?.[0]?.phoneNumber ?? null;

  const user = await prisma.user.create({
    data: {
      clerkUserId: userId,
      email: email ?? undefined,
      name: name ?? undefined,
      phone: phone ?? undefined,
    },
  });

  return user as DbUser;
});

/** Get current user or null (does not create). */
export const getCurrentUser = cache(async (): Promise<DbUser | null> => {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { clerkUserId: userId } });
  return user as DbUser | null;
});
