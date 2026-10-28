import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { researchItems } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const rows = await db
    .select()
    .from(researchItems)
    .where(type ? eq(researchItems.type, type) : undefined)
    .orderBy(desc(researchItems.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });
  const [created] = await db
    .insert(researchItems)
    .values({
      type: body.type ?? "concorrencia",
      title,
      content: body.content ?? null,
    })
    .returning();
  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const id = Number(body.id);
  if (!id) return NextResponse.json({ error: "id em falta" }, { status: 400 });
  const patch: Partial<typeof researchItems.$inferInsert> = {};
  if (body.title !== undefined) patch.title = String(body.title);
  if (body.type !== undefined) patch.type = String(body.type);
  if (body.content !== undefined) patch.content = body.content;
  const [updated] = await db
    .update(researchItems)
    .set(patch)
    .where(eq(researchItems.id, id))
    .returning();
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id em falta" }, { status: 400 });
  await db.delete(researchItems).where(eq(researchItems.id, id));
  return NextResponse.json({ ok: true });
}
