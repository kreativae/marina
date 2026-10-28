import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eventTypes } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const all = req.nextUrl.searchParams.get("all") === "1";
  const rows = await db
    .select()
    .from(eventTypes)
    .where(all ? undefined : eq(eventTypes.active, true))
    .orderBy(asc(eventTypes.id));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

  let slug = slugify(name) || `tipo-${Date.now()}`;
  const [existing] = await db
    .select()
    .from(eventTypes)
    .where(eq(eventTypes.slug, slug))
    .limit(1);
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const [created] = await db
    .insert(eventTypes)
    .values({
      name,
      slug,
      duration: Number(body.duration) || 60,
      description: body.description ?? null,
      tagPreset: body.tagPreset ?? "mentoria",
      active: body.active !== false,
    })
    .returning();
  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const id = Number(body.id);
  if (!id) return NextResponse.json({ error: "id em falta" }, { status: 400 });

  const patch: Partial<typeof eventTypes.$inferInsert> = {};
  if (body.name !== undefined) patch.name = String(body.name);
  if (body.duration !== undefined) patch.duration = Number(body.duration) || 60;
  if (body.description !== undefined) patch.description = body.description;
  if (body.tagPreset !== undefined) patch.tagPreset = body.tagPreset;
  if (body.active !== undefined) patch.active = Boolean(body.active);

  const [updated] = await db
    .update(eventTypes)
    .set(patch)
    .where(eq(eventTypes.id, id))
    .returning();
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id em falta" }, { status: 400 });
  await db
    .update(eventTypes)
    .set({ active: false })
    .where(eq(eventTypes.id, id));
  return NextResponse.json({ ok: true });
}
