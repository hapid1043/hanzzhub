import crypto from "crypto";
import { getSessionUser, db } from "@/lib/session";

export async function POST(req) {
  const user = await getSessionUser(req);
  if (!user) return Response.json({ error: "Belum login" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const code = String(body?.code || "").trim().toUpperCase();
  if (!code) return Response.json({ error: "Kode belum diisi" }, { status: 400 });

  const hash = crypto.createHash("sha256").update(code).digest("hex");
  const sql = db();

  // Kode sekali pakai: hanya berhasil jika belum dipakai
  const used = await sql`update premium_codes set used_by = ${user.id}
    where code_hash = ${hash} and used_by is null
    returning code_hash`;
  if (used.length === 0) {
    return Response.json({ error: "Kode salah atau sudah dipakai" }, { status: 400 });
  }

  await sql`update users set is_premium = true where id = ${user.id}`;
  return Response.json({ ok: true });
}
