import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select()
    .from(campaigns)
    .orderBy(desc(campaigns.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
  const [created] = await db
    .insert(campaigns)
    .values({
      name,
      type: body.type ?? "newsletter",
      channel: body.channel ?? "email",
      frequency: body.frequency ?? "semanal",
      segment: body.segment ?? "todos",
      status: body.status ?? "rascunho",
    })
    .returning();
  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const id = Number(body.id);
  if (!id) return NextResponse.json({ error: "id em falta" }, { status: 400 });
  const patch: Partial<typeof campaigns.$inferInsert> = {};
  for (const key of ["name", "type", "channel", "frequency", "segment", "status"] as const) {
    if (body[key] !== undefined) patch[key] = String(body[key]);
  }
  const [updated] = await db
    .update(campaigns)
    .set(patch)
    .where(eq(campaigns.id, id))
    .returning();
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id em falta" }, { status: 400 });
  await db.delete(campaigns).where(eq(campaigns.id, id));
  return NextResponse.json({ ok: true });
}
