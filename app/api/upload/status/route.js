import { getSessionUser, db } from "@/lib/session";
import { decrypt } from "@/lib/crypto";

export async function GET(req) {
  try {
    const user = await getSessionUser(req);
    if (!user) return Response.json({ error: "Belum login" }, { status: 401 });

    const opId = new URL(req.url).searchParams.get("op");
    if (!opId) return Response.json({ error: "op belum diisi" }, { status: 400 });

    const sql = db();
    // Pastikan operasi ini milik user yang sedang login
    const rows = await sql`select id, status from uploads
      where op_id = ${opId} and user_id = ${user.id}`;
    if (rows.length === 0) {
      return Response.json({ error: "Upload tidak ditemukan" }, { status: 404 });
    }
    if (rows[0].status !== "pending") {
      return Response.json({ status: rows[0].status });
    }

    const apiKey = decrypt(user.api_key_enc);
    const r = await fetch(`https://apis.roblox.com/assets/v1/operations/${opId}`, {
      headers: { "x-api-key": apiKey },
    });
    if (!r.ok) {
      return Response.json({ status: "pending", note: `Roblox ${r.status}` });
    }

    const j = await r.json();
    if (!j.done) {
      return Response.json({ status: "pending" });
    }

    const assetId = j.response?.assetId ? String(j.response.assetId) : null;
    if (assetId) {
      await sql`update uploads set status = 'done', asset_id = ${assetId} where id = ${rows[0].id}`;
      return Response.json({ status: "done", assetId });
    }

    await sql`update uploads set status = 'failed' where id = ${rows[0].id}`;
    return Response.json({ status: "failed", error: j.error || null });
  } catch (err) {
    console.error("status error:", err);
    return Response.json(
      { error: "Gagal cek status: " + (err?.message || "error tidak diketahui") },
      { status: 500 }
    );
  }
}
