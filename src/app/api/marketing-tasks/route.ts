import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { marketingTasks } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select()
    .from(marketingTasks)
    .orderBy(desc(marketingTasks.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });
  const [created] = await db
    .insert(marketingTasks)
    .values({
      title,
      owner: body.owner ?? "Marina",
      deadline: body.deadline || null,
      stage: body.stage ?? "ideia",
      notes: body.notes ?? null,
    })
    .returning();
  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const id = Number(body.id);
  if (!id) return NextResponse.json({ error: "id em falta" }, { status: 400 });
  const patch: Partial<typeof marketingTasks.$inferInsert> = {};
  if (body.title !== undefined) patch.title = String(body.title);
  if (body.owner !== undefined) patch.owner = String(body.owner);
  if (body.deadline !== undefined) patch.deadline = body.deadline || null;
  if (body.stage !== undefined) patch.stage = String(body.stage);
  if (body.notes !== undefined) patch.notes = body.notes;
  const [updated] = await db
    .update(marketingTasks)
    .set(patch)
    .where(eq(marketingTasks.id, id))
    .returning();
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id em falta" }, { status: 400 });
  await db.delete(marketingTasks).where(eq(marketingTasks.id, id));
  return NextResponse.json({ ok: true });
}
