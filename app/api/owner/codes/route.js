import crypto from "crypto";
import { db } from "@/lib/session";

const chunk = () => crypto.randomBytes(5).toString("hex").toUpperCase().slice(0, 8);

export async function POST(req) {
  if (req.headers.get("x-owner-secret") !== process.env.OWNER_SECRET) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const count = Math.min(Number(body.count) || 1, 50);
  const sql = db();
  const codes = [];

  for (let i = 0; i < count; i++) {
    const code = `HZ-${chunk()}-${chunk()}`;
    const hash = crypto.createHash("sha256").update(code).digest("hex");
    await sql`insert into premium_codes (code_hash) values (${hash})`;
    codes.push(code);
  }
  return Response.json({ codes });
}
