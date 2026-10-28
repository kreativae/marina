import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { and, asc, eq, gte, lt } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const conditions = [];
  if (p.get("platform")) conditions.push(eq(posts.platform, p.get("platform")!));
  if (p.get("stage")) conditions.push(eq(posts.stage, p.get("stage")!));
  if (p.get("month")) {
    const [y, m] = p.get("month")!.split("-").map(Number);
    if (y && m) {
      const start = `${y}-${String(m).padStart(2, "0")}-01`;
      const endMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
      conditions.push(gte(posts.date, start));
      conditions.push(lt(posts.date, endMonth));
    }
  }

  const rows = await db
    .select()
    .from(posts)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(posts.date), asc(posts.time));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const theme = String(body.theme ?? "").trim();
  const date = String(body.date ?? "");
  if (!theme || !date) {
    return NextResponse.json({ error: "Tema e data são obrigatórios" }, { status: 400 });
  }
  const [created] = await db
    .insert(posts)
    .values({
      theme,
      date,
      time: body.time ?? "10:00",
      platform: body.platform ?? "instagram",
      format: body.format ?? "post",
      copy: body.copy ?? null,
      hashtags: body.hashtags ?? null,
      designLink: body.designLink ?? null,
      owner: body.owner ?? "Marina",
      stage: body.stage ?? "ideia",
      reach: Number(body.reach) || 0,
      engagement: Number(body.engagement) || 0,
      saves: Number(body.saves) || 0,
    })
    .returning();
  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const id = Number(body.id);
  if (!id) return NextResponse.json({ error: "id em falta" }, { status: 400 });
  const patch: Partial<typeof posts.$inferInsert> = {};
  for (const key of [
    "theme",
    "date",
    "time",
    "platform",
    "format",
    "copy",
    "hashtags",
    "designLink",
    "owner",
    "stage",
  ] as const) {
    if (body[key] !== undefined) patch[key] = body[key];
  }
  for (const key of ["reach", "engagement", "saves"] as const) {
    if (body[key] !== undefined) patch[key] = Number(body[key]) || 0;
  }
  const [updated] = await db
    .update(posts)
    .set(patch)
    .where(eq(posts.id, id))
    .returning();
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id em falta" }, { status: 400 });
  await db.delete(posts).where(eq(posts.id, id));
  return NextResponse.json({ ok: true });
}
