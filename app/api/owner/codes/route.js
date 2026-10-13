import crypto from "crypto";
import { db } from "@/lib/session";

const chunk = () => crypto.randomBytes(5).toString("hex").toUpperCase().slice(0, 8);

export async function POST(req) {
  const expected = (process.env.OWNER_SECRET || "").trim();
  const given = (req.headers.get("x-owner-secret") || "").trim();

  if (!expected || given !== expected) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const count = Math.min(Math.max(Number(body.count) || 1, 1), 50);
  const sql = db();
  const codes = [];

  try {
    for (let i = 0; i < count; i++) {
      const code = `HZ-${chunk()}-${chunk()}`;
      const hash = crypto.createHash("sha256").update(code).digest("hex");
      await sql`insert into premium_codes (code_hash) values (${hash})`;
      codes.push(code);
    }
    return Response.json({ codes });
  } catch (err) {
    console.error("owner codes error:", err);
    return Response.json(
      { error: "Gagal membuat kode: " + (err?.message || "error tidak diketahui") },
      { status: 500 }
    );
  }
}
