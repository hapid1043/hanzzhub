import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";
import { encrypt } from "@/lib/crypto";

const sql = neon(process.env.DATABASE_URL);

export async function POST(req) {
  const { username, password, robloxId, apiKey } = await req.json();
  if (!username || !password || !robloxId || !apiKey)
    return Response.json({ error: "Data belum lengkap" }, { status: 400 });

  // Cek ID Roblox valid
  const r = await fetch(`https://users.roblox.com/v1/users/${robloxId}`);
  if (!r.ok) return Response.json({ error: "Roblox ID tidak ditemukan" }, { status: 400 });

  const hash = await bcrypt.hash(password, 12);
  try {
    await sql`insert into users (username, password_hash, roblox_id, api_key_enc)
              values (${username}, ${hash}, ${robloxId}, ${encrypt(apiKey)})`;
  } catch {
    return Response.json({ error: "Username sudah dipakai" }, { status: 409 });
  }
  return Response.json({ ok: true });
}
