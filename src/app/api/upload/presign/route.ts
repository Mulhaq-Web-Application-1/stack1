import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import {
  getPresignedUploadUrl,
  getR2Key,
  validateFile,
  isR2Configured,
} from "@/lib/r2";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isR2Configured()) {
    return NextResponse.json({ error: "Storage is not configured" }, { status: 503 });
  }

  const { searchParams } = req.nextUrl;
  const filename = searchParams.get("filename");
  const type = searchParams.get("type");
  const sizeStr = searchParams.get("size");

  if (!filename || !type || !sizeStr) {
    return NextResponse.json({ error: "filename, type, and size are required" }, { status: 400 });
  }

  const size = parseInt(sizeStr, 10);
  if (isNaN(size)) {
    return NextResponse.json({ error: "Invalid size" }, { status: 400 });
  }

  const validation = validateFile({ name: filename, size, type } as File);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // Get or create the DB user
  let user = await prisma.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) {
    user = await prisma.user.create({ data: { clerkUserId: userId } });
  }

  const key = getR2Key(user.id, filename);
  const uploadUrl = await getPresignedUploadUrl(key, type, 3600);

  return NextResponse.json({ uploadUrl, key });
}
