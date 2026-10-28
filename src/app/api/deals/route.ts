import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts, deals } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select({ deal: deals, contact: contacts })
    .from(deals)
    .innerJoin(contacts, eq(deals.contactId, contacts.id))
    .orderBy(desc(deals.updatedAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  let contactId = Number(body.contactId) || 0;

  if (!contactId && body.contactName) {
    // Criação rápida de contacto a partir do pipeline
    const [c] = await db
      .insert(contacts)
      .values({
        name: String(body.contactName).trim(),
        email: `lead-${Date.now()}@pendente.local`,
        origin: "outro",
        productInterest: body.product ?? "mentoria",
      })
      .returning();
    contactId = c.id;
  }
  if (!contactId) {
    return NextResponse.json({ error: "Contacto obrigatório" }, { status: 400 });
  }

  const [created] = await db
    .insert(deals)
    .values({
      contactId,
      title: String(body.title ?? "Nova oportunidade"),
      product: body.product ?? "mentoria",
      value: Math.round(Number(body.value ?? 0) * 100),
      paymentMethod: body.paymentMethod ?? "",
      expectedCloseDate: body.expectedCloseDate || null,
      stage: body.stage ?? "novo-lead",
    })
    .returning();
  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const id = Number(body.id);
  if (!id) return NextResponse.json({ error: "id em falta" }, { status: 400 });

  const patch: Partial<typeof deals.$inferInsert> = { updatedAt: new Date() };
  if (body.title !== undefined) patch.title = String(body.title);
  if (body.stage !== undefined) patch.stage = String(body.stage);
  if (body.product !== undefined) patch.product = String(body.product);
  if (body.paymentMethod !== undefined)
    patch.paymentMethod = String(body.paymentMethod);
  if (body.expectedCloseDate !== undefined)
    patch.expectedCloseDate = body.expectedCloseDate || null;
  if (body.value !== undefined)
    patch.value =
      Number(body.value) > 10000
        ? Math.round(Number(body.value))
        : Math.round(Number(body.value) * 100);

  const [updated] = await db
    .update(deals)
    .set(patch)
    .where(eq(deals.id, id))
    .returning();

  // Se o deal avança para pagamento, atualizar o contacto
  if (updated && body.stage === "pagamento") {
    await db
      .update(contacts)
      .set({ paymentStatus: "pago", updatedAt: new Date() })
      .where(eq(contacts.id, updated.contactId));
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id em falta" }, { status: 400 });
  await db.delete(deals).where(eq(deals.id, id));
  return NextResponse.json({ ok: true });
}
