import bcrypt from "bcryptjs";
import { createSession, SESSION_COOKIE, db } from "@/lib/session";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "");

    if (!username || !password) {
      return Response.json({ error: "Data belum lengkap" }, { status: 400 });
    }

    const sql = db();
    const rows = await sql`select id, password_hash from users where username = ${username}`;
    if (rows.length === 0) {
      return Response.json({ error: "Username atau password salah" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, rows[0].password_hash);
    if (!ok) {
      return Response.json({ error: "Username atau password salah" }, { status: 401 });
    }

    const token = await createSession(rows[0].id);
    const res = Response.json({ ok: true });
    res.headers.set(
      "Set-Cookie",
      `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`
    );
    return res;
  } catch (err) {
    console.error("login error:", err);
    return Response.json(
      { error: "Gagal login: " + (err?.message || "error tidak diketahui") },
      { status: 500 }
    );
  }
}
