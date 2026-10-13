import { getSessionUser, db } from "@/lib/session";
import { decrypt } from "@/lib/crypto";

const FREE_LIMIT = 3;
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(req) {
  try {
    const user = await getSessionUser(req);
    if (!user) return Response.json({ error: "Belum login" }, { status: 401 });

    const form = await req.formData();
    const file = form.get("file");
    const type = form.get("type") === "image" ? "image" : "model";
    const name = String(form.get("name") || "").trim();

    if (!file || typeof file === "string") {
      return Response.json({ error: "File belum dipilih" }, { status: 400 });
    }
    if (file.size === 0 || file.size > MAX_BYTES) {
      return Response.json({ error: "File kosong atau lebih dari 4MB" }, { status: 400 });
    }

    const sql = db();

    if (!user.is_premium) {
      const rows = await sql`select count(*)::int as n from uploads
        where user_id = ${user.id} and created_at >= current_date`;
      if (rows[0].n >= FREE_LIMIT) {
        return Response.json(
          { error: "Batas 3 upload per hari tercapai. Pakai kode Premium." },
          { status: 429 }
        );
      }
    }

    let apiKey;
    try {
      apiKey = decrypt(user.api_key_enc);
    } catch {
      return Response.json(
        { error: "API key tidak bisa dibaca. Daftar ulang atau hubungi owner." },
        { status: 500 }
      );
    }

    // Baca isi file sepenuhnya ke memori
    const bytes = await file.arrayBuffer();
    if (bytes.byteLength === 0) {
      return Response.json({ error: "Isi file kosong" }, { status: 400 });
    }
    const fileBlob = new Blob([bytes], { type: "application/octet-stream" });

    const assetType = type === "image" ? "Decal" : "Model";
    const displayName = name || file.name || "upload";

    const requestJson = JSON.stringify({
      assetType,
      displayName,
      creationContext: { creator: { userId: String(user.roblox_id) } },
    });

    const fd = new FormData();
    fd.append("request", new Blob([requestJson], { type: "application/json" }));
    fd.append("fileContent", fileBlob, file.name || "upload.rbxm");

    const up = await fetch("https://apis.roblox.com/assets/v1/assets", {
      method: "POST",
      headers: { "x-api-key": apiKey },
      body: fd,
    });

    if (!up.ok) {
      const t = await up.text();
      return Response.json({ error: `Roblox ${up.status}: ${t}` }, { status: 502 });
    }

    const op = await up.json();
    if (!op.operationId) {
      return Response.json({ error: "Roblox tidak mengembalikan operationId" }, { status: 502 });
    }

    await sql`insert into uploads (user_id, op_id, status)
              values (${user.id}, ${op.operationId}, 'pending')`;

    return Response.json({ operationId: op.operationId, status: "pending" });
  } catch (err) {
    console.error("upload error:", err);
    return Response.json(
      { error: "Gagal upload: " + (err?.message || "error tidak diketahui") },
      { status: 500 }
    );
  }
}
