import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, createAdminSession, getAdminCredentials } from "../../../../lib/adminAuth";

export async function POST(request: NextRequest) {
  const { username, password, rememberMe } = await request.json().catch(() => ({}));
  const credentials = getAdminCredentials();
  if (!credentials.username || !credentials.password || username !== credentials.username || password !== credentials.password) {
    return NextResponse.json({ error: "Invalid admin credentials." }, { status: 401 });
  }
  const response = NextResponse.json({ authenticated: true });
  const maxAge = rememberMe === true ? 60 * 60 * 24 * 30 : 60 * 60 * 8;
  response.cookies.set(ADMIN_COOKIE, createAdminSession(credentials.username, rememberMe === true), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge, path: "/"
  });
  return response;
}
