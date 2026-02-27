import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/groups - List groups the current user is a member of. */
export async function GET() {
  try {
    const user = await getOrCreateUser();
    const memberships = await prisma.groupMember.findMany({
      where: { userId: user.id },
      include: {
        group: {
          include: {
            parentGroup: { select: { id: true, name: true } },
            childGroups: {
              select: { id: true, name: true, logoUrl: true, _count: { select: { pages: true } } },
            },
            _count: { select: { pages: true } },
          },
        },
      },
    });
    const groups = memberships.map((m) => ({
      ...m.group,
      role: m.role,
    }));
    return NextResponse.json(groups);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
