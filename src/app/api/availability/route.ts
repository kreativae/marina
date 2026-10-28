import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  availabilityWindows,
  blockedSlots,
  bookings,
  eventTypes,
} from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";
import {
  intervalsOverlap,
  isValidCalendarDate,
  lisbonDateTime,
  timeToMinutes,
  weekdayForDate,
} from "@/lib/scheduling";
import {
  getGoogleCalendarBusySlots,
  getIntegrationStatuses,
} from "@/lib/integrations";

export const dynamic = "force-dynamic";

function toHHMM(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(
    min % 60
  ).padStart(2, "0")}`;
}

// GET /api/availability?date=2025-06-16&eventTypeId=1
// Devolve os slots livres, cruzando: janelas de disponibilidade (A3),
// agendamentos já existentes e bloqueios vindos do Google Calendar (A4).
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  const eventTypeId = Number(req.nextUrl.searchParams.get("eventTypeId"));

  if (!date || !isValidCalendarDate(date) || !eventTypeId) {
    return NextResponse.json(
      { error: "Parâmetros date e eventTypeId são obrigatórios" },
      { status: 400 }
    );
  }

  const [ev] = await db
    .select()
    .from(eventTypes)
    .where(eq(eventTypes.id, eventTypeId))
    .limit(1);
  if (!ev) return NextResponse.json({ error: "Tipo de evento inválido" }, { status: 404 });

  const weekday = weekdayForDate(date);

  const googleConfigured = getIntegrationStatuses().find(
    (status) => status.id === "google-calendar"
  )?.configured;
  try {
    const [windows, dayBookings, dayBlocks, allTypes, remoteBlocks] =
      await Promise.all([
        db
          .select()
          .from(availabilityWindows)
          .where(
            and(
              eq(availabilityWindows.dayOfWeek, weekday),
              eq(availabilityWindows.active, true)
            )
          ),
        db
          .select()
          .from(bookings)
          .where(and(eq(bookings.date, date), ne(bookings.status, "cancelado"))),
        db.select().from(blockedSlots).where(eq(blockedSlots.date, date)),
        db.select().from(eventTypes),
        googleConfigured
          ? getGoogleCalendarBusySlots(date)
          : Promise.resolve([] as { startTime: string; endTime: string }[]),
      ]);

    const durById = new Map(allTypes.map((t) => [t.id, t.duration]));

    const now = new Date();
    const localNow = lisbonDateTime(now);
    const isToday = localNow.date === date;
    const nowMin = localNow.minutes + 60;

    const slots: { time: string; end: string }[] = [];

    for (const w of windows) {
      const wStart = timeToMinutes(w.startTime);
      const wEnd = timeToMinutes(w.endTime);
      for (let t = wStart; t + ev.duration <= wEnd; t += 30) {
        const sStart = t;
        const sEnd = t + ev.duration;
        if (isToday && sStart <= nowMin) continue;

        const clashBooking = dayBookings.some((b) =>
          intervalsOverlap(
            sStart,
            sEnd,
            timeToMinutes(b.startTime),
            timeToMinutes(b.startTime) + (durById.get(b.eventTypeId) ?? 60)
          )
        );
        if (clashBooking) continue;

        const clashBlock = dayBlocks.some((b) =>
          intervalsOverlap(
            sStart,
            sEnd,
            timeToMinutes(b.startTime),
            timeToMinutes(b.endTime)
          )
        );
        if (clashBlock) continue;

        const clashGoogleCalendar = remoteBlocks.some((block) =>
          intervalsOverlap(
            sStart,
            sEnd,
            timeToMinutes(block.startTime),
            timeToMinutes(block.endTime)
          )
        );
        if (clashGoogleCalendar) continue;

        slots.push({ time: toHHMM(sStart), end: toHHMM(sEnd) });
      }
    }

    return NextResponse.json({ date, duration: ev.duration, slots });
  } catch (error) {
    console.error("Could not load booking availability:", error);
    return NextResponse.json(
      { error: "Não foi possível verificar a disponibilidade agora." },
      { status: 503 }
    );
  }
}
