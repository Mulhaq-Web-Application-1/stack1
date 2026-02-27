import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import {
  uploadToR2,
  validateImageFile,
  getR2KeyForImage,
  getPublicUrlForKey,
  isR2Configured,
} from "@/lib/r2";

/** POST /api/upload/image - upload image to R2, return public URL. Body: FormData with file, prefix (profile|group|page), identifier (userId|groupId|pageId). */
export async function POST(req: NextRequest) {
  try {
    await getOrCreateUser();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const prefix = formData.get("prefix") as string;
    const identifier = formData.get("identifier") as string;

    if (!file || !prefix || !identifier) {
      return NextResponse.json(
        { error: "Missing file, prefix, or identifier" },
        { status: 400 }
      );
    }

    const validPrefixes = ["profile", "group", "page"];
    if (!validPrefixes.includes(prefix)) {
      return NextResponse.json(
        { error: "Invalid prefix; use profile, group, or page" },
        { status: 400 }
      );
    }

    const validation = validateImageFile(file);
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.error ?? "Invalid image" },
        { status: 400 }
      );
    }

    if (!isR2Configured()) {
      return NextResponse.json(
        { error: "Storage is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME." },
        { status: 503 }
      );
    }

    const key = getR2KeyForImage(
      prefix as "profile" | "group" | "page",
      identifier,
      file.name
    );
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToR2(key, buffer, file.type);

    const url = getPublicUrlForKey(key);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Please sign in to upload." }, { status: 401 });
    }
    const isSigV4 = /credential|sigv4|slash-separated/i.test(message);
    const hint = isSigV4
      ? " Check .env: use R2 API token from Cloudflare R2 → Manage R2 API Tokens (no quotes, one line per variable). Create a new token if needed."
      : "";
    console.error("Upload image error:", err);
    return NextResponse.json(
      { error: message + hint },
      { status: 500 }
    );
  }
}
