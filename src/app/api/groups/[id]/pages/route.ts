import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/groups/[id]/pages - List pages in a group (must be a member). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const user = await getOrCreateUser();
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        members: { some: { userId: user.id } },
      },
      include: {
        pages: { orderBy: { updatedAt: "desc" as const } },
      },
    });
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    return NextResponse.json(group.pages);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
