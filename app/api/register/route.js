import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";
import { encrypt } from "@/lib/crypto";

const sql = neon(process.env.DATABASE_URL);

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return Response.json({ error: "Format data salah" }, { status: 400 });
    }

    const username = String(body.username || "").trim();
    const password = String(body.password || "");
    const robloxId = String(body.robloxId || "").trim();
    const apiKey = String(body.apiKey || "").trim();

    if (!username || !password || !robloxId || !apiKey) {
      return Response.json({ error: "Data belum lengkap" }, { status: 400 });
    }
    if (password.length < 6) {
      return Response.json({ error: "Password minimal 6 karakter" }, { status: 400 });
    }

    // Cek Roblox ID valid
    const r = await fetch(`https://users.roblox.com/v1/users/${robloxId}`);
    if (!r.ok) {
      return Response.json({ error: "Roblox ID tidak ditemukan" }, { status: 400 });
    }

    // Cek username sudah dipakai
    const existing = await sql`select id from users where username = ${username}`;
    if (existing.length > 0) {
      return Response.json({ error: "Username sudah dipakai" }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 12);
    const apiKeyEnc = encrypt(apiKey);

    await sql`insert into users (username, password_hash, roblox_id, api_key_enc)
              values (${username}, ${hash}, ${robloxId}, ${apiKeyEnc})`;

    return Response.json({ ok: true });
  } catch (err) {
    console.error("register error:", err);
    return Response.json(
      { error: "Gagal menyimpan: " + (err?.message || "error tidak diketahui") },
      { status: 500 }
    );
  }
}
