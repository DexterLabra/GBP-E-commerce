import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE = "gbp-admin-session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function secret() {
  return process.env.ADMIN_SESSION_SECRET || "replace-this-admin-session-secret";
}

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createAdminSession(username: string) {
  const payload = `${username}|${Date.now() + SESSION_TTL_SECONDS * 1000}`;
  return `${encode(payload)}.${sign(payload)}`;
}

export function verifyAdminSession(token?: string | null) {
  if (!token) return false;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return false;
  try {
    const payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
    const expected = sign(payload);
    const validSignature = timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    const expiry = Number(payload.split("|")[1]);
    return validSignature && Number.isFinite(expiry) && expiry > Date.now();
  } catch {
    return false;
  }
}

export function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || "",
    password: process.env.ADMIN_PASSWORD || ""
  };
}

export function isAdminRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const token = cookieHeader.split(";").map(value => value.trim()).find(value => value.startsWith(`${ADMIN_COOKIE}=`))?.split("=").slice(1).join("=");
  return verifyAdminSession(token);
}
