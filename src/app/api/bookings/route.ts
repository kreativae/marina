import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  availabilityWindows,
  blockedSlots,
  bookings,
  eventTypes,
} from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { addTagToContact, logInteraction, upsertContact } from "@/lib/crm";
import {
  createGoogleCalendarEvent,
  createZoomMeeting,
  getGoogleCalendarBusySlots,
  getIntegrationStatuses,
  sendBookingEmail,
  sendWhatsAppBookingTemplate,
  type IntegrationId,
} from "@/lib/integrations";
import {
  intervalsOverlap,
  isValidCalendarDate,
  lisbonDateTime,
  timeToMinutes,
  weekdayForDate,
} from "@/lib/scheduling";

export const dynamic = "force-dynamic";

type IntegrationResult = {
  id: IntegrationId;
  status: "sent" | "pending" | "skipped" | "error";
  message: string;
  value?: string;
};

async function runIntegration(
  id: IntegrationId,
  configured: boolean,
  successMessage: string,
  pendingMessage: string,
  action: () => Promise<string | void>
): Promise<IntegrationResult> {
  if (!configured) {
    return { id, status: "pending", message: pendingMessage };
  }
  try {
    const value = await action();
    return {
      id,
      status: "sent",
      message: successMessage,
      ...(typeof value === "string" ? { value } : {}),
    };
  } catch (error) {
    console.error(`Booking integration failed (${id}):`, error);
    return {
      id,
      status: "error",
      message: `Não foi possível concluir a integração ${id}.`,
    };
  }
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
    const whatsappOptIn = body.whatsappOptIn === true && Boolean(phone);

    if (
      !eventTypeId ||
      !isValidCalendarDate(date) ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(startTime) ||
      !name ||
      !email.includes("@")
    ) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const [ev] = await db
      .select()
      .from(eventTypes)
      .where(eq(eventTypes.id, eventTypeId))
      .limit(1);
    if (!ev || !ev.active) {
      return NextResponse.json(
        { error: "Tipo de sessão inválido" },
        { status: 404 }
      );
    }

    const configured = new Map(
      getIntegrationStatuses().map(({ id, configured }) => [id, configured])
    );
    const [dayBookings, windows, dayBlocks] = await Promise.all([
      db
        .select({ booking: bookings, eventType: eventTypes })
        .from(bookings)
        .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
        .where(eq(bookings.date, date)),
      db
        .select()
        .from(availabilityWindows)
        .where(eq(availabilityWindows.dayOfWeek, weekdayForDate(date))),
      db.select().from(blockedSlots).where(eq(blockedSlots.date, date)),
    ]);
    const requestedStart = timeToMinutes(startTime);
    const requestedEnd = requestedStart + ev.duration;
    const localNow = lisbonDateTime();
    if (
      date < localNow.date ||
      (date === localNow.date && requestedStart <= localNow.minutes + 60)
    ) {
      return NextResponse.json(
        { error: "Escolhe um horário com pelo menos uma hora de antecedência." },
        { status: 409 }
      );
    }
    const insideAvailability = windows.some(
      (window) =>
        window.active &&
        requestedStart >= timeToMinutes(window.startTime) &&
        requestedEnd <= timeToMinutes(window.endTime)
    );
    if (!insideAvailability) {
      return NextResponse.json(
        { error: "Esse horário não está disponível." },
        { status: 409 }
      );
    }
    const blocked = dayBlocks.some((block) =>
      intervalsOverlap(
        requestedStart,
        requestedEnd,
        timeToMinutes(block.startTime),
        timeToMinutes(block.endTime)
      )
    );
    if (blocked) {
      return NextResponse.json(
        { error: "Esse horário está bloqueado." },
        { status: 409 }
      );
    }
    const clash = dayBookings.some(
      ({ booking, eventType: existingType }) =>
        booking.status !== "cancelado" &&
        intervalsOverlap(
          requestedStart,
          requestedEnd,
          timeToMinutes(booking.startTime),
          timeToMinutes(booking.startTime) + existingType.duration
        )
    );
    if (clash) {
      return NextResponse.json(
        { error: "Esse horário acabou de ser ocupado. Escolhe outro." },
        { status: 409 }
      );
    }

    if (configured.get("google-calendar")) {
      try {
        const busySlots = await getGoogleCalendarBusySlots(date);
        const calendarClash = busySlots.some((slot) =>
          intervalsOverlap(
            requestedStart,
            requestedEnd,
            timeToMinutes(slot.startTime),
            timeToMinutes(slot.endTime)
          )
        );
        if (calendarClash) {
          return NextResponse.json(
            { error: "Esse horário está ocupado no Google Calendar." },
            { status: 409 }
          );
        }
      } catch (error) {
        console.error("Could not verify Google Calendar availability:", error);
        return NextResponse.json(
          { error: "Não foi possível verificar a disponibilidade agora." },
          { status: 503 }
        );
      }
    }

    const [createdBooking] = await db
      .insert(bookings)
      .values({
        eventTypeId,
        contactName: name,
        contactEmail: email,
        contactPhone: phone || null,
        date,
        startTime,
        status: "confirmado",
        whatsappOptIn,
        notes: body.notes ? String(body.notes) : null,
      })
      .returning();

    const contact = await upsertContact({
      name,
      email,
      phone: phone || null,
      origin: "site",
      productInterest: ev.tagPreset,
    });
    await addTagToContact(contact.id, ev.tagPreset);
    await addTagToContact(contact.id, "lead-quente");

    const integrations: IntegrationResult[] = [];
    let zoomLink: string | null = null;
    let zoomMeetingId: string | null = null;
    let googleEventId: string | null = null;
    let googleSynced = false;
    let zoomSentEmail = false;
    let linkSentWhatsapp = false;

    if (configured.get("zoom")) {
      try {
        const meeting = await createZoomMeeting({
          title: `${ev.name} — Marina Loyola`,
          date,
          startTime,
          duration: ev.duration,
        });
        zoomLink = meeting.joinUrl;
        zoomMeetingId = meeting.id;
        integrations.push({
          id: "zoom",
          status: "sent",
          message: "Reunião Zoom criada.",
        });
      } catch (error) {
        console.error("Could not create Zoom meeting:", error);
        integrations.push({
          id: "zoom",
          status: "error",
          message: "Não foi possível criar a reunião Zoom.",
        });
      }
    } else {
      integrations.push({
        id: "zoom",
        status: "pending",
        message: "Zoom ainda não configurado.",
      });
    }

    const [googleResult, emailResult, whatsappResult] = await Promise.all([
      runIntegration(
        "google-calendar",
        Boolean(configured.get("google-calendar")),
        "Evento criado no Google Calendar.",
        "Google Calendar ainda não configurado.",
        () =>
          createGoogleCalendarEvent({
          title: `${ev.name} — ${name}`,
          date,
          startTime,
          duration: ev.duration,
          attendeeEmail: email,
          description: [
            `Sessão: ${ev.name}`,
            `Contacto: ${name} (${email})`,
            `Zoom: ${zoomLink ?? "não configurado"}`,
            body.notes ? `Notas: ${String(body.notes)}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
          })
      ),
      runIntegration(
        "resend",
        Boolean(configured.get("resend")),
        "Confirmação enviada por e-mail.",
        "E-mail transacional ainda não configurado.",
        () =>
          sendBookingEmail({
          to: email,
          name,
          title: ev.name,
          date,
          startTime,
          zoomUrl: zoomLink,
          })
      ),
      whatsappOptIn
        ? runIntegration(
            "whatsapp",
            Boolean(configured.get("whatsapp")),
            "Confirmação enviada por WhatsApp.",
            "WhatsApp ainda não configurado.",
            () =>
              sendWhatsAppBookingTemplate({
          phone,
          name,
          title: ev.name,
          date,
          startTime,
          zoomUrl: zoomLink,
              })
          )
        : Promise.resolve({
            id: "whatsapp" as const,
            status: "skipped" as const,
            message: "Sem consentimento para contacto por WhatsApp.",
          }),
    ]);

    integrations.push(googleResult, emailResult, whatsappResult);
    googleEventId = googleResult.status === "sent" ? googleResult.value ?? null : null;
    googleSynced = googleResult.status === "sent";
    zoomSentEmail = emailResult.status === "sent";
    linkSentWhatsapp = whatsappResult.status === "sent";

    const [booking] = await db
      .update(bookings)
      .set({
        zoomLink,
        zoomMeetingId,
        googleEventId,
        googleSynced,
        zoomSentEmail,
        linkSentWhatsapp,
      })
      .where(eq(bookings.id, createdBooking.id))
      .returning();

    await logInteraction(
      contact.id,
      "sistema",
      `Agendamento: ${ev.name} · ${date} às ${startTime}. Zoom: ${zoomMeetingId ? "criado" : "pendente"}; Calendar: ${googleSynced ? "sincronizado" : "pendente"}; e-mail: ${zoomSentEmail ? "enviado" : "pendente"}.`
    );

    return NextResponse.json({ booking, eventType: ev, integrations }, { status: 201 });
  } catch (error) {
    console.error("Booking creation failed:", error);
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
