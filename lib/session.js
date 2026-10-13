import { SignJWT, jwtVerify } from "jose";
import { neon } from "@neondatabase/serverless";

export const SESSION_COOKIE = "hz_session";

export function db() {
  return neon(process.env.DATABASE_URL);
}

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET belum diatur");
  return new TextEncoder().encode(s);
}

export async function createSession(userId) {
  return new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function getSessionUser(req) {
  const cookie = req.headers.get("cookie") || "";
  const part = cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(SESSION_COOKIE + "="));
  if (!part) return null;

  const token = part.slice(SESSION_COOKIE.length + 1);
  try {
    const { payload } = await jwtVerify(token, secret());
    const rows = await db()`
      select id, roblox_id, api_key_enc, is_premium
      from users where id = ${payload.uid}`;
    return rows[0] || null;
  } catch {
    return null;
  }
}
