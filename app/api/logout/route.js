import { SESSION_COOKIE } from "@/lib/session";

export async function POST() {
  const res = Response.json({ ok: true });
  res.headers.set(
    "Set-Cookie",
    `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
  );
  return res;
}
