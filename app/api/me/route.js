import { getSessionUser, db } from "@/lib/session";

export async function GET(req) {
  const user = await getSessionUser(req);
  if (!user) return Response.json({ error: "Belum login" }, { status: 401 });

  const sql = db();
  const who = await sql`select username from users where id = ${user.id}`;
  const today = await sql`select count(*)::int as n from uploads
    where user_id = ${user.id} and created_at >= current_date`;
  const history = await sql`select op_id, asset_id, status, created_at
    from uploads where user_id = ${user.id}
    order by created_at desc limit 30`;

  return Response.json({
    username: who[0]?.username || "",
    robloxId: user.roblox_id,
    isPremium: !!user.is_premium,
    usedToday: today[0].n,
    limit: user.is_premium ? null : 3,
    history,
  });
}
