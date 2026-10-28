import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  availabilityWindows,
  blockedSlots,
  bookings,
  eventTypes,
} from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";

export const dynamic = "force-dynamic";

function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(
    min % 60
  ).padStart(2, "0")}`;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

// GET /api/availability?date=2025-06-16&eventTypeId=1
// Devolve os slots livres, cruzando: janelas de disponibilidade (A3),
// agendamentos já existentes e bloqueios vindos do Google Calendar (A4).
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  const eventTypeId = Number(req.nextUrl.searchParams.get("eventTypeId"));

  if (!date || !eventTypeId) {
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

  const weekday = new Date(`${date}T12:00:00`).getDay();

  const [windows, dayBookings, dayBlocks, allTypes] = await Promise.all([
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
  ]);

  const durById = new Map(allTypes.map((t) => [t.id, t.duration]));

  const now = new Date();
  const isToday =
    now.getFullYear() === Number(date.slice(0, 4)) &&
    now.getMonth() + 1 === Number(date.slice(5, 7)) &&
    now.getDate() === Number(date.slice(8, 10));
  const nowMin = now.getHours() * 60 + now.getMinutes() + 60; // buffer de 1h

  const slots: { time: string; end: string }[] = [];

  for (const w of windows) {
    const wStart = toMinutes(w.startTime);
    const wEnd = toMinutes(w.endTime);
    for (let t = wStart; t + ev.duration <= wEnd; t += 30) {
      const sStart = t;
      const sEnd = t + ev.duration;
      if (isToday && sStart <= nowMin) continue;

      const clashBooking = dayBookings.some((b) =>
        overlaps(
          sStart,
          sEnd,
          toMinutes(b.startTime),
          toMinutes(b.startTime) + (durById.get(b.eventTypeId) ?? 60)
        )
      );
      if (clashBooking) continue;

      const clashBlock = dayBlocks.some((b) =>
        overlaps(sStart, sEnd, toMinutes(b.startTime), toMinutes(b.endTime))
      );
      if (clashBlock) continue;

      slots.push({ time: toHHMM(sStart), end: toHHMM(sEnd) });
    }
  }

  return NextResponse.json({ date, duration: ev.duration, slots });
}
