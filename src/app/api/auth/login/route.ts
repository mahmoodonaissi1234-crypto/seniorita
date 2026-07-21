import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, checkCredentials } from "@/lib/auth";
import { createSessionToken } from "@/lib/session";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  const user = await checkCredentials(email, password);
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, createSessionToken(user.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return response;
}
