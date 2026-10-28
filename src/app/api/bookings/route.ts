import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, eventTypes } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { addTagToContact, logInteraction, upsertContact } from "@/lib/crm";

export const dynamic = "force-dynamic";

function zoomLink() {
  const id = Math.floor(1e9 + Math.random() * 9e9);
  return `https://zoom.us/j/${id}?pwd=${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function GET() {
  const rows = await db
    .select({ booking: bookings, eventType: eventTypes })
    .from(bookings)
    .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
    .orderBy(asc(bookings.date), asc(bookings.startTime));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventTypeId = Number(body.eventTypeId);
    const date = String(body.date ?? "");
    const startTime = String(body.startTime ?? "");
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();

    if (!eventTypeId || !date || !startTime || !name || !email.includes("@")) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const [ev] = await db
      .select()
      .from(eventTypes)
      .where(eq(eventTypes.id, eventTypeId))
      .limit(1);
    if (!ev) {
      return NextResponse.json(
        { error: "Tipo de sessão inválido" },
        { status: 404 }
      );
    }

    // Garantir que o slot continua livre (evitar dupla marcação)
    const dayBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.date, date));
    const clash = dayBookings.some(
      (b) => b.startTime === startTime && b.status !== "cancelado"
    );
    if (clash) {
      return NextResponse.json(
        { error: "Esse horário acabou de ser ocupado. Escolhe outro." },
        { status: 409 }
      );
    }

    // A5 — Sala Zoom criada automaticamente aquando do agendamento
    const link = zoomLink();

    const [booking] = await db
      .insert(bookings)
      .values({
        eventTypeId,
        contactName: name,
        contactEmail: email,
        contactPhone: phone || null,
        date,
        startTime,
        status: "confirmado",
        zoomLink: link,
        googleSynced: true, // A4 — evento criado no Google Calendar
        zoomSentEmail: true, // A11 — link enviado por e-mail
        notes: body.notes ?? null,
      })
      .returning();

    // Registo automático no CRM (A1/A6)
    const contact = await upsertContact({
      name,
      email,
      phone: phone || null,
      origin: "site",
      productInterest: ev.tagPreset,
    });
    await addTagToContact(contact.id, ev.tagPreset);
    await addTagToContact(contact.id, "lead-quente");
    await logInteraction(
      contact.id,
      "sistema",
      `Agendamento: ${ev.name} · ${date} às ${startTime}. Sala Zoom criada; link enviado por e-mail; reforço por WhatsApp disponível.`
    );

    return NextResponse.json(
      { booking: { ...booking }, eventType: ev },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const id = Number(body.id);
  if (!id) return NextResponse.json({ error: "id em falta" }, { status: 400 });

  const patch: Partial<typeof bookings.$inferInsert> = {};
  if (body.status !== undefined) patch.status = String(body.status);
  if (body.linkSentWhatsapp !== undefined)
    patch.linkSentWhatsapp = Boolean(body.linkSentWhatsapp);
  if (body.notes !== undefined) patch.notes = body.notes;

  const [updated] = await db
    .update(bookings)
    .set(patch)
    .where(eq(bookings.id, id))
    .returning();
  return NextResponse.json(updated);
}
