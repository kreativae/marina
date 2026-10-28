import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts, deals } from "@/db/schema";
import { eq } from "drizzle-orm";
import { addTagToContact, logInteraction, upsertContact } from "@/lib/crm";

export const dynamic = "force-dynamic";

// GET — documentação do endpoint (para configurar no painel Hotmart)
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/webhooks/hotmart",
    metodo: "POST",
    eventos: ["purchase", "refund"],
    payload_exemplo: {
      event: "purchase",
      name: "Nome do comprador",
      email: "comprador@email.com",
      phone: "+351 912 345 678",
      product: "workshop",
      value: 47,
      currency: "EUR",
    },
    notas:
      "Compra → contacto criado/atualizado com #cliente + status «Fechado» + deal em «Pagamento Recebido». Reembolso → estado de pagamento atualizado para «Reembolsado».",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = String(body.event ?? "purchase");
    const name = String(body.name ?? "").trim() || "Comprador Hotmart";
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = body.phone ? String(body.phone) : null;
    const product = ["workshop", "mentoria", "design"].includes(body.product)
      ? body.product
      : "workshop";
    const valueCents = Math.round(Number(body.value ?? 0) * 100);

    if (!email.includes("@")) {
      return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
    }

    const geography =
      body.geography ??
      (phone?.replace(/\D/g, "").startsWith("351") ? "portugal" : "internacional");

    const contact = await upsertContact({
      name,
      email,
      phone,
      origin: "hotmart",
      productInterest: product,
    });

    if (event === "refund") {
      await db
        .update(contacts)
        .set({ paymentStatus: "reembolsado", updatedAt: new Date() })
        .where(eq(contacts.id, contact.id));
      await addTagToContact(contact.id, "reembolsado");
      await logInteraction(
        contact.id,
        "sistema",
        `Webhook Hotmart — REEMBOLSO de ${product}. Estado de pagamento atualizado.`
      );
      return NextResponse.json({ ok: true, event, contactId: contact.id });
    }

    // PURCHASE — compra aprovada na Hotmart
    await db
      .update(contacts)
      .set({
        type: "cliente",
        status: "fechado",
        paymentStatus: "pago",
        geography,
        updatedAt: new Date(),
      })
      .where(eq(contacts.id, contact.id));

    await addTagToContact(contact.id, product);
    await addTagToContact(contact.id, "hotmart");
    await addTagToContact(contact.id, "cliente");
    await addTagToContact(contact.id, `cliente-${product}`);

    const [deal] = await db
      .insert(deals)
      .values({
        contactId: contact.id,
        title: `Hotmart — ${product === "workshop" ? "Workshop" : "Mentoria"}`,
        product,
        value: valueCents,
        paymentMethod: "hotmart",
        expectedCloseDate: new Date().toISOString().slice(0, 10),
        stage: "pagamento",
      })
      .returning();

    await logInteraction(
      contact.id,
      "sistema",
      `Webhook Hotmart — COMPRA aprovada (${product}, ${(valueCents / 100).toFixed(2)}€). Recibo automático emitido pela Hotmart. Deal criado em «Pagamento Recebido».`
    );

    return NextResponse.json({
      ok: true,
      event: "purchase",
      contactId: contact.id,
      dealId: deal.id,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
