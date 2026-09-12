import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "../../../../lib/adminAuth";

export async function POST() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, expires: new Date(0), sameSite: "lax", path: "/" });
  return response;
}
