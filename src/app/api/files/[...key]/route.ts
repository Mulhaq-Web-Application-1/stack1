import { NextRequest, NextResponse } from "next/server";
import { getObjectFromR2, isR2Configured } from "@/lib/r2";

/**
 * GET /api/files/[...key] — Proxy for R2 objects when R2_PUBLIC_URL is not set.
 * Streams the file from R2 so <img src="/api/files/..."> loads reliably (no redirect).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key: keyParts } = await params;
    if (!keyParts?.length) {
      return NextResponse.json(
        { error: "Missing file key" },
        { status: 400 }
      );
    }

    const key = keyParts.join("/");
    if (!key || key.includes("..")) {
      return NextResponse.json(
        { error: "Invalid file key" },
        { status: 400 }
      );
    }

    if (!isR2Configured()) {
      return NextResponse.json(
        { error: "Storage is not configured" },
        { status: 503 }
      );
    }

    const { body, contentType } = await getObjectFromR2(key);
    const headers = new Headers();
    if (contentType) headers.set("Content-Type", contentType);
    // Allow caching so repeated image loads don't hit R2 every time
    headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600");
    return new NextResponse(body, { headers });
  } catch (err) {
    console.error("Files proxy error:", err);
    const message = err instanceof Error ? err.message : "Failed to resolve file";
    if (message.includes("NoSuchKey") || message.includes("not found")) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to resolve file" },
      { status: 500 }
    );
  }
}
