import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts, deals, hotmartEvents } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { addTagToContact, logInteraction, upsertContact } from "@/lib/crm";

export const dynamic = "force-dynamic";

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord {
  return typeof value === "object" && value !== null
    ? (value as JsonRecord)
    : {};
}

function secureEqual(left: string, right: string) {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return (
    leftBytes.length === rightBytes.length &&
    timingSafeEqual(leftBytes, rightBytes)
  );
}

function getPhone(value: unknown) {
  if (typeof value === "string") return value;
  const phone = record(value);
  const parts = [
    phone.country_code ?? phone.ddi,
    phone.area_code ?? phone.ddd,
    phone.number,
  ].filter((part) => typeof part === "string" || typeof part === "number");
  return parts.length ? parts.join("") : null;
}

function getProduct(value: unknown): "workshop" | "mentoria" | "design" {
  const name = String(record(value).name ?? "").toLowerCase();
  if (name.includes("mentoria")) return "mentoria";
  if (name.includes("design")) return "design";
  return "workshop";
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/webhooks/hotmart",
    method: "POST",
    authentication: "X-HOTMART-HOTTOK",
    events: ["PURCHASE_APPROVED", "PURCHASE_REFUNDED", "PURCHASE_CHARGEBACK"],
  });
}

export async function POST(req: NextRequest) {
  const secret = process.env.HOTMART_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook Hotmart não configurado." },
      { status: 503 }
    );
  }

  const receivedSecret = req.headers.get("x-hotmart-hottok") ?? "";
  if (!secureEqual(secret, receivedSecret)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let payload: JsonRecord;
  try {
    payload = record(await req.json());
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const event = String(payload.event ?? "").toUpperCase();
  if (
    !["PURCHASE_APPROVED", "PURCHASE_REFUNDED", "PURCHASE_CHARGEBACK"].includes(
      event
    )
  ) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const data = record(payload.data);
  const purchase = record(data.purchase);
  const buyer = record(data.buyer);
  const email = String(buyer.email ?? "").trim().toLowerCase();
  const transactionId = String(
    purchase.transaction ?? data.transaction ?? ""
  ).trim();
  const product = getProduct(data.product);

  if (!email.includes("@") || !transactionId) {
    return NextResponse.json(
      { error: "Evento sem e-mail ou identificador de transação." },
      { status: 400 }
    );
  }

  try {
    const [alreadyHandled] = await db
      .select({ id: hotmartEvents.id })
      .from(hotmartEvents)
      .where(
        and(
          eq(hotmartEvents.transactionId, transactionId),
          eq(hotmartEvents.event, event)
        )
      )
      .limit(1);
    if (alreadyHandled) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    const phone =
      getPhone(buyer.checkout_phone) ??
      getPhone(buyer.phone) ??
      getPhone(buyer.mobile_phone);

    if (event === "PURCHASE_APPROVED") {
      const amount = Number(purchase.price && record(purchase.price).value);
      if (!Number.isFinite(amount) || amount < 0) {
        return NextResponse.json(
          { error: "Valor da compra inválido." },
          { status: 400 }
        );
      }

      const [existingDeal] = await db
        .select({ id: deals.id })
        .from(deals)
        .where(eq(deals.externalReference, transactionId))
        .limit(1);
      if (existingDeal) {
        await db.insert(hotmartEvents).values({ transactionId, event }).onConflictDoNothing();
        return NextResponse.json({ ok: true, duplicate: true });
      }

      const contact = await upsertContact({
        name: String(buyer.name ?? "Comprador Hotmart").trim(),
        email,
        phone,
        origin: "hotmart",
        productInterest: product,
      });
      const geography = phone?.replace(/\D/g, "").startsWith("351")
        ? "portugal"
        : "internacional";

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

      for (const tag of [product, "hotmart", "cliente", `cliente-${product}`]) {
        await addTagToContact(contact.id, tag);
      }

      await db.insert(deals).values({
        contactId: contact.id,
        title: `Hotmart — ${product}`,
        product,
        value: Math.round(amount * 100),
        paymentMethod: "hotmart",
        externalReference: transactionId,
        expectedCloseDate: new Date().toISOString().slice(0, 10),
        stage: "pagamento",
      });
      await logInteraction(
        contact.id,
        "sistema",
        `Webhook Hotmart — compra aprovada (${product}, ${amount.toFixed(2)} ${String(record(purchase.price).currency ?? "")}).`
      );
    } else {
      const [contact] = await db
        .select()
        .from(contacts)
        .where(eq(contacts.email, email))
        .limit(1);
      if (contact) {
        await db
          .update(contacts)
          .set({ paymentStatus: "reembolsado", updatedAt: new Date() })
          .where(eq(contacts.id, contact.id));
        await db
          .update(deals)
          .set({ stage: "pos-venda", updatedAt: new Date() })
          .where(eq(deals.externalReference, transactionId));
        await addTagToContact(contact.id, "reembolsado");
        await logInteraction(
          contact.id,
          "sistema",
          `Webhook Hotmart — ${event === "PURCHASE_REFUNDED" ? "reembolso" : "chargeback"} registado.`
        );
      }
    }

    await db
      .insert(hotmartEvents)
      .values({ transactionId, event })
      .onConflictDoNothing();
    return NextResponse.json({ ok: true, event });
  } catch (error) {
    console.error("Hotmart webhook processing failed:", error);
    return NextResponse.json(
      { error: "Falha ao processar o evento Hotmart." },
      { status: 500 }
    );
  }
}
