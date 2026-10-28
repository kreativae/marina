import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blockedSlots } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select()
    .from(blockedSlots)
    .orderBy(asc(blockedSlots.date), asc(blockedSlots.startTime));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const date = String(body.date ?? "");
  const startTime = String(body.startTime ?? "");
  const endTime = String(body.endTime ?? "");
  if (!date || !startTime || !endTime || startTime >= endTime) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const [created] = await db
    .insert(blockedSlots)
    .values({
      date,
      startTime,
      endTime,
      reason: String(body.reason ?? ""),
    })
    .returning();
  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id em falta" }, { status: 400 });
  await db.delete(blockedSlots).where(eq(blockedSlots.id, id));
  return NextResponse.json({ ok: true });
}
