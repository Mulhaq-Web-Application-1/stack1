import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/groups/[id] - Group detail (must be a member). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getOrCreateUser();
    const group = await prisma.group.findFirst({
      where: {
        id,
        members: { some: { userId: user.id } },
      },
      include: {
        parentGroup: { select: { id: true, name: true, logoUrl: true } },
        childGroups: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            _count: { select: { pages: true } },
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                profileImageUrl: true,
              },
            },
          },
        },
        pages: { select: { id: true, title: true, description: true, coverPhotoUrl: true, updatedAt: true } },
      },
    });
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    return NextResponse.json(group);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
