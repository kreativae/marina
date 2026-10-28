import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts, interactions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const contactId = Number(req.nextUrl.searchParams.get("contactId"));
  if (!contactId) {
    return NextResponse.json({ error: "contactId em falta" }, { status: 400 });
  }
  const rows = await db
    .select()
    .from(interactions)
    .where(eq(interactions.contactId, contactId))
    .orderBy(desc(interactions.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const contactId = Number(body.contactId);
  const content = String(body.content ?? "").trim();
  const channel = String(body.channel ?? "whatsapp");
  if (!contactId || !content) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }
  const [created] = await db
    .insert(interactions)
    .values({ contactId, channel, content })
    .returning();
  // Tocar o updatedAt do contacto (interação recente = lead ativo)
  await db
    .update(contacts)
    .set({ updatedAt: new Date() })
    .where(eq(contacts.id, contactId));
  return NextResponse.json(created, { status: 201 });
}
