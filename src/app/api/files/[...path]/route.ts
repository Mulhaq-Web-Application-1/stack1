import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPresignedDownloadUrl } from "@/lib/r2";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const path = (await params).path;
    const key = path.join("/");
    if (!key) return NextResponse.json({ error: "Bad request" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const file = await prisma.file.findFirst({
      where: { key, userId: user.id },
    });
    if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const url = await getPresignedDownloadUrl(file.key);
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
