"use client";
import { useEffect, useState } from "react";

const css = `
*{box-sizing:border-box}
body{margin:0;background:#07070a;color:#f4f4f5;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.wrap{max-width:480px;margin:0 auto;padding:18px 14px 40px}
.card{background:linear-gradient(180deg,#15151b,#0e0e13);border:1px solid #25252d;border-radius:20px;padding:20px;margin-bottom:14px;box-shadow:0 12px 32px rgba(0,0,0,.4)}
.brand{font-size:24px;font-weight:800;letter-spacing:-.02em;background:linear-gradient(90deg,#fff,#a5b4fc);-webkit-background-clip:text;background-clip:text;color:transparent}
.muted{color:#8b8b95;font-size:13px}
.h{font-size:18px;font-weight:700;margin:0 0 4px}
.tabs{display:grid;grid-template-columns:1fr 1fr;gap:6px;background:#111116;border:1px solid #25252d;border-radius:14px;padding:4px;margin-bottom:14px}
.tab{padding:11px;border:0;border-radius:10px;background:transparent;color:#a1a1aa;font-weight:600;font-size:15px;cursor:pointer}
.tab.on{background:#fff;color:#0a0a0c}
label.f{display:block;font-size:13px;color:#a1a1aa;margin-top:12px}
input{width:100%;padding:13px 14px;border-radius:12px;border:1px solid #2a2a33;background:#0b0b0f;color:#fff;font-size:15px;margin-top:6px;outline:none}
input:focus{border-color:#6366f1}
.btn{width:100%;padding:14px;border:0;border-radius:14px;background:#fff;color:#0a0a0c;font-weight:700;font-size:15px;cursor:pointer;margin-top:14px}
.btn:disabled{opacity:.5;cursor:default}
.btn.ghost{background:#1c1c24;color:#fff;border:1px solid #2a2a33;width:auto;padding:9px 14px;margin:0;font-size:13px}
.link{background:none;border:0;color:#a5b4fc;cursor:pointer;font-size:14px;padding:0;margin-top:12px}
.seg{display:grid;grid-template-columns:1fr 1fr;gap:6px;background:#0b0b0f;border-radius:12px;padding:4px;margin-top:12px}
.seg button{padding:10px;border:0;border-radius:9px;background:transparent;color:#a1a1aa;font-weight:600;cursor:pointer}
.seg button.on{background:#25252d;color:#fff}
.drop{display:block;border:1.5px dashed #34343e;border-radius:16px;padding:26px 14px;text-align:center;margin-top:12px;cursor:pointer;color:#a1a1aa;font-size:14px}
.drop input{display:none}
.drop b{display:block;color:#fff;font-size:15px;margin-bottom:4px}
.pill{display:inline-block;padding:4px 10px;border-radius:99px;font-size:12px;font-weight:700;background:#22222a;color:#d4d4d8}
.pill.ok{background:#052e1a;color:#4ade80}
.pill.warn{background:#2e2505;color:#fbbf24}
.pill.bad{background:#2e0505;color:#f87171}
.bar{height:8px;background:#22222a;border-radius:99px;overflow:hidden;margin-top:10px}
.bar>div{height:100%;background:linear-gradient(90deg,#818cf8,#4ade80)}
.row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid #1f1f27;font-size:14px}
.row:last-child{border-bottom:0}
.mono{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;word-break:break-all}
.msg{padding:12px 14px;border-radius:12px;margin-top:12px;font-size:14px}
.msg.err{background:#2e0505;color:#fecaca}
.msg.ok{background:#052e1a;color:#bbf7d0}
.head{display:flex;justify-content:space-between;align-items:center;gap:10px}
`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pillClass = (s) => (s === "done" ? "ok" : s === "failed" ? "bad" : "warn");
const pillText = (s) => ({ done: "Selesai", failed: "Gagal", pending: "Diproses" }[s] || s);

function Shell({ children }) {
  return (
    <>
      <style>{css}</style>
      <div className="wrap">{children}</div>
    </>
  );
}

function Msg({ m }) {
  if (!m) return null;
  return <div className={"msg " + m.t}>{m.x}</div>;
}

function Auth({ onDone }) {
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ username: "", password: "", robloxId: "", apiKey: "" });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const creds = { username: f.username, password: f.password };
    const url = mode === "login" ? "/api/login" : "/api/register";
    const body = mode === "login" ? creds : f;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setBusy(false);
      return setMsg({ t: "err", x: j.error || "Gagal" });
    }
    if (mode === "register") {
      // Setelah daftar, langsung login
      const r2 = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creds),
      });
      if (!r2.ok) {
        setBusy(false);
        setMode("login");
        return setMsg({ t: "ok", x: "Akun dibuat. Silakan login." });
      }
    }
    setBusy(false);
    onDone();
  }

  return (
    <div className="card">
      <div className="h">{mode === "login" ? "Masuk" : "Buat akun"}</div>
      <div className="muted">Upload file .rbxm atau gambar jadi ID Roblox</div>
      <form onSubmit={submit}>
        <label className="f">Username<input value={f.username} onChange={set("username")} required /></label>
        <label className="f">Password<input type="password" value={f.password} onChange={set("password")} required minLength={6} /></label>
        {mode === "register" && (
          <>
            <label className="f">Roblox User ID<input inputMode="numeric" value={f.robloxId} onChange={set("robloxId")} required /></label>
            <label className="f">API key Roblox<input type="password" value={f.apiKey} onChange={set("apiKey")} required /></label>
            <div className="muted" style={{ marginTop: 8 }}>API key disimpan terenkripsi dan tidak pernah ditampilkan lagi.</div>
          </>
        )}
        <button className="btn" disabled={busy}>{busy ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar"}</button>
      </form>
      <Msg m={msg} />
      <button className="link" onClick={() => { setMode(mode === "login" ? "register" : "login"); setMsg(null); }}>
        {mode === "login" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
      </button>
    </div>
  );
}

function UploadPanel({ me, onChanged }) {
  const [type, setType] = useState("model");
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [result, setResult] = useState(null);
  const left = me.isPremium ? null : Math.max(0, me.limit - me.usedToday);
  const accept = type === "model" ? ".rbxm,.rbxmx" : "image/png,image/jpeg,image/gif,image/webp";

  async function go(e) {
    e.preventDefault();
    if (!file) return setMsg({ t: "err", x: "Pilih file dulu" });
    if (file.size > 4 * 1024 * 1024) return setMsg({ t: "err", x: "File lebih dari 4 MB" });

    setBusy(true);
    setMsg(null);
    setResult({ state: "pending" });
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", type);
    fd.append("name", name || file.name);

    const r = await fetch("/api/upload", { method: "POST", body: fd });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setBusy(false);
      setResult(null);
      return setMsg({ t: "err", x: j.error || "Upload gagal" });
    }

    let final = null;
    for (let i = 0; i < 40 && !final; i++) {
      await sleep(3000);
      const s = await fetch("/api/upload/status?op=" + encodeURIComponent(j.operationId))
        .then((x) => x.json())
        .catch(() => ({}));
      if (s.status === "done" || s.status === "failed") final = s;
    }
    setBusy(false);
    setResult(final ? { state: final.status, assetId: final.assetId, error: final.error } : { state: "pending" });
    onChanged();
  }

  return (
    <>
      <div className="card">
        <div className="head">
          <div className="h">Ubah file jadi ID Roblox</div>
          {me.isPremium ? <span className="pill ok">Premium</span> : <span className="pill">{left} tersisa hari ini</span>}
        </div>
        <form onSubmit={go}>
          <div className="seg">
            <button type="button" className={type === "model" ? "on" : ""} onClick={() => { setType("model"); setFile(null); }}>Model .rbxm</button>
            <button type="button" className={type === "image" ? "on" : ""} onClick={() => { setType("image"); setFile(null); }}>Gambar</button>
          </div>
          <label className="drop">
            <input type="file" accept={accept} onChange={(e) => setFile(e.target.files[0] || null)} />
            <b>{file ? file.name : type === "model" ? "Pilih file .rbxm" : "Pilih gambar"}</b>
            {file ? (file.size / 1024).toFixed(0) + " KB" : "Maks 4 MB"}
          </label>
          <label className="f">Nama<input value={name} onChange={(e) => setName(e.target.value)} placeholder="contoh: Mobil Keren" /></label>
          <button className="btn" disabled={busy || (left === 0)}>
            {busy ? "Diproses di Roblox..." : left === 0 ? "Batas harian tercapai" : "Generate ID"}
          </button>
        </form>
        <Msg m={msg} />
      </div>

      {result && (
        <div className="card">
          <div className="head">
            <div className="h">Hasil</div>
            <span className={"pill " + pillClass(result.state)}>{pillText(result.state)}</span>
          </div>
          {result.state === "pending" && <div className="muted" style={{ marginTop: 8 }}>Roblox sedang memproses. Biasanya 10 sampai 30 detik.</div>}
          {result.state === "done" && (
            <div className="row" style={{ marginTop: 8 }}>
              <span className="mono">{result.assetId}</span>
              <button className="btn ghost" onClick={() => navigator.clipboard?.writeText(result.assetId)}>Salin</button>
            </div>
          )}
          {result.state === "failed" && <div className="msg err">{String(result.error || "Roblox menolak file")}</div>}
        </div>
      )}
    </>
  );
}

function PremiumPanel({ me, onChanged }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const pct = me.isPremium ? 100 : Math.min(100, (me.usedToday / me.limit) * 100);

  async function activate(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = await fetch("/api/premium/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg({ t: "err", x: j.error || "Gagal" });
    setCode("");
    setMsg({ t: "ok", x: "Premium aktif. Upload tanpa batas." });
    onChanged();
  }

  return (
    <>
      <div className="card">
        <div className="head">
          <div className="h">Status akun</div>
          {me.isPremium ? <span className="pill ok">Premium</span> : <span className="pill">Free</span>}
        </div>
        {!me.isPremium && (
          <>
            <div className="muted" style={{ marginTop: 6 }}>{me.usedToday} dari 3 upload dipakai hari ini</div>
            <div className="bar"><div style={{ width: pct + "%" }} /></div>
          </>
        )}
        {me.isPremium && <div className="muted" style={{ marginTop: 6 }}>Upload tanpa batas harian.</div>}
      </div>

      {!me.isPremium && (
        <div className="card">
          <div className="h">Aktifkan Premium</div>
          <div className="muted">Minta kode sekali pakai ke owner, lalu masukkan di sini.</div>
          <form onSubmit={activate}>
            <label className="f">Kode Premium<input value={code} onChange={(e) => setCode(e.target.value)} placeholder="HZ-XXXXXXXX-XXXXXXXX" required /></label>
            <button className="btn" disabled={busy}>{busy ? "Memeriksa..." : "Aktifkan"}</button>
          </form>
          <Msg m={msg} />
        </div>
      )}
      {me.isPremium && <Msg m={msg} />}

      <div className="card">
        <div className="h">Aktivitas upload</div>
        {me.history.length === 0 && <div className="muted" style={{ marginTop: 8 }}>Belum ada upload.</div>}
        {me.history.map((h) => (
          <div className="row" key={h.op_id}>
            <div>
              <div>{new Date(h.created_at).toLocaleString("id-ID")}</div>
              {h.asset_id && <div className="mono muted">ID {h.asset_id}</div>}
            </div>
            <span className={"pill " + pillClass(h.status)}>{pillText(h.status)}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export default function Home() {
  const [me, setMe] = useState(undefined);
  const [tab, setTab] = useState("upload");

  async function load() {
    const r = await fetch("/api/me");
    setMe(r.ok ? await r.json() : null);
  }

  useEffect(() => {
    load();
  }, []);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    setMe(null);
  }

  if (me === undefined) {
    return <Shell><p className="muted">Memuat...</p></Shell>;
  }

  if (me === null) {
    return (
      <Shell>
        <div className="brand" style={{ marginBottom: 14 }}>HanzzHub</div>
        <Auth onDone={load} />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="head" style={{ marginBottom: 14 }}>
        <div>
          <div className="brand" style={{ fontSize: 20 }}>HanzzHub</div>
          <div className="muted">@{me.username} · ID {me.robloxId}</div>
        </div>
        <button className="btn ghost" onClick={logout}>Keluar</button>
      </div>

      <div className="tabs">
        <button className={"tab " + (tab === "upload" ? "on" : "")} onClick={() => setTab("upload")}>Upload</button>
        <button className={"tab " + (tab === "premium" ? "on" : "")} onClick={() => setTab("premium")}>Premium</button>
      </div>

      {tab === "upload" ? <UploadPanel me={me} onChanged={load} /> : <PremiumPanel me={me} onChanged={load} />}
    </Shell>
  );
}
