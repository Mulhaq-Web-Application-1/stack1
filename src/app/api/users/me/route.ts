import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";

/** GET /api/users/me - Current user profile (auth required). */
export async function GET() {
  try {
    const user = await getOrCreateUser();
    return NextResponse.json({
      id: user.id,
      clerkUserId: user.clerkUserId,
      email: user.email,
      name: user.name,
      phone: user.phone,
      profileImageUrl: user.profileImageUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
