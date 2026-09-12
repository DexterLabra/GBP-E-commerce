import { NextRequest, NextResponse } from "next/server";
const ADMIN_COOKIE = "gbp-admin-session";

async function hasValidSession(token?: string) {
  if (!token) return false;
  const [encodedPayload, signature] = token.split(".");
  const secret = process.env.ADMIN_SESSION_SECRET || "replace-this-admin-session-secret";
  if (!encodedPayload || !signature) return false;
  try {
    const payload = atob(encodedPayload.replace(/-/g, "+").replace(/_/g, "/"));
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const signatureBytes = Uint8Array.from(atob(signature.replace(/-/g, "+").replace(/_/g, "/")), character => character.charCodeAt(0));
    const expiry = Number(payload.split("|")[1]);
    return expiry > Date.now() && await crypto.subtle.verify("HMAC", key, signatureBytes, new TextEncoder().encode(payload));
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  if (!await hasValidSession(request.cookies.get(ADMIN_COOKIE)?.value)) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
