import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { availabilityWindows } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select()
    .from(availabilityWindows)
    .orderBy(asc(availabilityWindows.dayOfWeek), asc(availabilityWindows.startTime));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const dayOfWeek = Number(body.dayOfWeek);
  const startTime = String(body.startTime ?? "");
  const endTime = String(body.endTime ?? "");
  if (
    Number.isNaN(dayOfWeek) ||
    dayOfWeek < 0 ||
    dayOfWeek > 6 ||
    !startTime ||
    !endTime ||
    startTime >= endTime
  ) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const [created] = await db
    .insert(availabilityWindows)
    .values({ dayOfWeek, startTime, endTime, active: true })
    .returning();
  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const id = Number(body.id);
  if (!id) return NextResponse.json({ error: "id em falta" }, { status: 400 });
  const patch: Partial<typeof availabilityWindows.$inferInsert> = {};
  if (body.active !== undefined) patch.active = Boolean(body.active);
  if (body.startTime !== undefined) patch.startTime = String(body.startTime);
  if (body.endTime !== undefined) patch.endTime = String(body.endTime);
  const [updated] = await db
    .update(availabilityWindows)
    .set(patch)
    .where(eq(availabilityWindows.id, id))
    .returning();
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id em falta" }, { status: 400 });
  await db
    .delete(availabilityWindows)
    .where(
      and(eq(availabilityWindows.id, id))
    );
  return NextResponse.json({ ok: true });
}
