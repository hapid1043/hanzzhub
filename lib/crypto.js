import crypto from "crypto";

function getKey() {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex) throw new Error("ENCRYPTION_KEY belum diatur");
  return Buffer.from(hex, "hex");
}

export function encrypt(text) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([c.update(text, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc].map(b => b.toString("hex")).join(":");
}

export function decrypt(data) {
  const key = getKey();
  const [iv, tag, enc] = data.split(":").map(h => Buffer.from(h, "hex"));
  const d = crypto.createDecipheriv("aes-256-gcm", key, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
}
