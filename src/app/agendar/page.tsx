"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  Mail,
  MessageCircle,
  Video,
} from "lucide-react";
import { addDays, cn, formatDate, toYMD } from "@/lib/utils";

type EventType = {
  id: number;
  name: string;
  slug: string;
  duration: number;
  description: string | null;
  active: boolean;
};

type Slot = { time: string; end: string };

type BookingResult = {
  booking: {
    id: number;
    date: string;
    startTime: string;
    zoomLink: string | null;
  };
  eventType: EventType;
};

const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function AgendarPage() {
  const [step, setStep] = useState(1);
  const [types, setTypes] = useState<EventType[]>([]);
  const [type, setType] = useState<EventType | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<BookingResult | null>(null);
  const [copied, setCopied] = useState(false);

  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 14 }, (_, i) => addDays(today, i + 1));
  }, []);

  useEffect(() => {
    fetch("/api/event-types")
      .then((r) => r.json())
      .then(setTypes)
      .catch(() => setTypes([]));
  }, []);

  useEffect(() => {
    if (!type || !date) return;
    setSlots(null);
    setSlot(null);
    fetch(`/api/availability?date=${date}&eventTypeId=${type.id}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .catch(() => setSlots([]));
  }, [type, date]);

  async function submit() {
    if (!type || !date || !slot) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventTypeId: type.id,
          date,
          startTime: slot,
          name,
          email,
          phone,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao agendar");
      setResult(data);
      setStep(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao agendar");
    } finally {
      setLoading(false);
    }
  }

  const gcalUrl = result
    ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        `${result.eventType.name} — Marina Loyola`
      )}&dates=${result.booking.date.replaceAll("-", "")}T${result.booking.startTime.replace(
        ":",
        ""
      )}00/${result.booking.date.replaceAll("-", "")}T${String(
        Number(result.booking.startTime.slice(0, 2)) + 1
      ).padStart(2, "0")}${result.booking.startTime.slice(3, 5)}00&details=${encodeURIComponent(
        `Sala Zoom: ${result.booking.zoomLink ?? ""}`
      )}`
    : "#";

  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-ink/8 bg-paper/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="font-display text-lg font-semibold tracking-tight">
            Marina&nbsp;Loyola<span className="text-purple">.</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink/60 transition hover:text-purple"
          >
            <ArrowLeft className="size-4" />
            Voltar ao site
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[0.9fr_1.4fr]">
        {/* Painel esquerdo */}
        <aside className="grain relative overflow-hidden rounded-[28px] bg-ink p-8 text-white sm:p-10">
          <span className="absolute -top-16 -right-16 size-56 rounded-full bg-purple/40 blur-3xl" />
          <p className="text-xs font-bold tracking-[0.25em] text-grape uppercase">
            Agenda online
          </p>
          <h1 className="font-display mt-3 text-3xl leading-tight font-medium sm:text-4xl">
            Agendar uma <em className="italic text-grape">sessão.</em>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            Escolhe o serviço, o dia e a hora. A sala Zoom é criada
            automaticamente e o link chega-te por e-mail — com reforço por
            WhatsApp.
          </p>
          <ol className="mt-9 space-y-4">
            {[
              ["Escolhe o serviço", step >= 1],
              ["Escolhe dia e hora", step >= 2],
              ["Os teus dados", step >= 3],
              ["Confirmação", step >= 4],
            ].map(([label, active], i) => (
              <li key={label as string} className="flex items-center gap-3">
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-full border text-xs font-bold transition",
                    step > i || (step === 4 && i === 3)
                      ? "border-purple bg-purple text-white"
                      : "border-white/20 text-white/50"
                  )}
                >
                  {step > i + 1 || step === 4 ? (
                    <Check className="size-4" />
                  ) : (
                    i + 1
                  )}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    active ? "text-white" : "text-white/45"
                  )}
                >
                  {label}
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-10 space-y-3 border-t border-white/10 pt-6 text-xs text-white/50">
            <p className="flex items-center gap-2">
              <Video className="size-4 text-grape" /> Zoom: sala criada
              automaticamente
            </p>
            <p className="flex items-center gap-2">
              <CalendarDays className="size-4 text-grape" /> Sincronizado com o
              Google Calendar da Marina
            </p>
            <p className="flex items-center gap-2">
              <Mail className="size-4 text-grape" /> Confirmação por e-mail +
              WhatsApp
            </p>
          </div>
        </aside>

        {/* Painel direito */}
        <section className="rounded-[28px] border border-ink/8 bg-white p-6 shadow-xl shadow-ink/5 sm:p-10">
          {/* PASSO 1 — serviço */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="font-display text-2xl font-semibold">
                O que procuras?
              </h2>
              <p className="mt-1 text-sm text-ink/55">
                Seleciona o tipo de sessão.
              </p>
              <div className="mt-7 space-y-3">
                {types.length === 0 && (
                  <div className="flex items-center gap-3 text-sm text-ink/50">
                    <Loader2 className="size-4 animate-spin" /> A carregar
                    serviços…
                  </div>
                )}
                {types.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setType(t);
                      setStep(2);
                    }}
                    className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-paper p-5 text-left transition hover:border-purple hover:bg-purple-soft"
                  >
                    <div>
                      <p className="font-display text-lg font-semibold">
                        {t.name}
                      </p>
                      {t.description && (
                        <p className="mt-1 text-sm text-ink/55">
                          {t.description}
                        </p>
                      )}
                    </div>
                    <span className="flex shrink-0 items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-ink ring-1 ring-ink/10 transition group-hover:bg-purple group-hover:text-white group-hover:ring-purple">
                      <Clock className="size-3.5" />
                      {t.duration} min
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PASSO 2 — data e hora */}
          {step === 2 && type && (
            <div className="animate-fade-in">
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-ink/50 uppercase tracking-wider transition hover:text-purple"
              >
                <ArrowLeft className="size-3.5" /> {type.name} · {type.duration} min
              </button>
              <h2 className="font-display mt-3 text-2xl font-semibold">
                Escolhe o dia
              </h2>
              <div className="mt-5 grid grid-cols-7 gap-2">
                {days.map((d) => {
                  const ymd = toYMD(d);
                  const active = date === ymd;
                  return (
                    <button
                      key={ymd}
                      onClick={() => setDate(ymd)}
                      className={cn(
                        "flex flex-col items-center rounded-xl border px-1 py-2.5 transition",
                        active
                          ? "border-purple bg-purple text-white shadow-lg shadow-purple/25"
                          : "border-ink/10 bg-paper hover:border-purple/50"
                      )}
                    >
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase",
                          active ? "text-white/70" : "text-ink/45"
                        )}
                      >
                        {WEEKDAY_SHORT[d.getDay()]}
                      </span>
                      <span className="font-display text-lg font-semibold leading-tight">
                        {d.getDate()}
                      </span>
                    </button>
                  );
                })}
              </div>

              <h3 className="font-display mt-8 text-lg font-semibold">
                Horários disponíveis{" "}
                {date && (
                  <span className="text-ink/40 font-normal">
                    — {formatDate(date)}
                  </span>
                )}
              </h3>
              {!date && (
                <p className="mt-3 text-sm text-ink/50">
                  Seleciona um dia para veres os horários.
                </p>
              )}
              {date && slots === null && (
                <div className="mt-4 flex items-center gap-2 text-sm text-ink/50">
                  <Loader2 className="size-4 animate-spin" /> A verificar
                  disponibilidade…
                </div>
              )}
              {date && slots && slots.length === 0 && (
                <p className="mt-3 rounded-xl bg-purple-soft px-4 py-3 text-sm text-purple">
                  Sem horários livres neste dia — experimenta outro.
                </p>
              )}
              {date && slots && slots.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                  {slots.map((s) => (
                    <button
                      key={s.time}
                      onClick={() => {
                        setSlot(s.time);
                        setStep(3);
                      }}
                      className="rounded-xl border border-ink/10 bg-paper px-3 py-3 text-sm font-bold transition hover:border-purple hover:bg-purple hover:text-white"
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PASSO 3 — dados */}
          {step === 3 && type && date && slot && (
            <div className="animate-fade-in">
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-ink/50 uppercase tracking-wider transition hover:text-purple"
              >
                <ArrowLeft className="size-3.5" /> {formatDate(date)} às {slot}
              </button>
              <h2 className="font-display mt-3 text-2xl font-semibold">
                Os teus dados
              </h2>
              <div className="mt-6 grid gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-ink/50">
                    Nome completo
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="O teu nome"
                    className="mt-1.5 w-full rounded-xl border border-ink/12 bg-paper px-4 py-3 text-sm"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-ink/50">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nome@email.com"
                      className="mt-1.5 w-full rounded-xl border border-ink/12 bg-paper px-4 py-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-ink/50">
                      WhatsApp (com código de país)
                    </label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+351 …"
                      className="mt-1.5 w-full rounded-xl border border-ink/12 bg-paper px-4 py-3 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-ink/50">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Contexto, objetivos, perguntas…"
                    className="mt-1.5 w-full resize-none rounded-xl border border-ink/12 bg-paper px-4 py-3 text-sm"
                  />
                </div>
                {error && (
                  <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                  </p>
                )}
                <button
                  onClick={submit}
                  disabled={loading || !name.trim() || !email.includes("@")}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-6 py-4 text-sm font-bold text-white transition hover:bg-purple disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      Confirmar agendamento
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
                <p className="text-xs text-ink/45">
                  Ao confirmar, a sessão entra na agenda da Marina e recebes a
                  confirmação por e-mail.
                </p>
              </div>
            </div>
          )}

          {/* PASSO 4 — confirmação */}
          {step === 4 && result && (
            <div className="animate-fade-in text-center">
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-purple-soft">
                <CheckCircle2 className="size-8 text-purple" />
              </span>
              <h2 className="font-display mt-5 text-3xl font-semibold">
                Está <em className="text-purple italic">agendado!</em>
              </h2>
              <p className="mt-2 text-ink/60">
                {result.eventType.name} · {formatDate(result.booking.date)} às{" "}
                {result.booking.startTime}
              </p>

              <div className="mx-auto mt-8 max-w-md rounded-2xl border border-ink/10 bg-paper p-5 text-left">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink/50">
                  <Video className="size-4 text-purple" /> Sala Zoom
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 truncate rounded-lg bg-white px-3 py-2.5 text-xs ring-1 ring-ink/10">
                    {result.booking.zoomLink}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        result.booking.zoomLink ?? ""
                      );
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                    className="grid size-10 shrink-0 place-items-center rounded-lg bg-ink text-white transition hover:bg-purple"
                    aria-label="Copiar link"
                  >
                    {copied ? (
                      <Check className="size-4" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </button>
                </div>
                <ul className="mt-4 space-y-2 text-xs leading-relaxed text-ink/60">
                  <li className="flex gap-2">
                    <Mail className="mt-0.5 size-3.5 shrink-0 text-purple" />
                    O link foi enviado automaticamente para o teu e-mail.
                  </li>
                  <li className="flex gap-2">
                    <MessageCircle className="mt-0.5 size-3.5 shrink-0 text-purple" />
                    Recebes um lembrete por WhatsApp antes da sessão.
                  </li>
                  <li className="flex gap-2">
                    <CalendarDays className="mt-0.5 size-3.5 shrink-0 text-purple" />
                    O evento já está no Google Calendar da Marina.
                  </li>
                </ul>
              </div>

              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <a
                  href={gcalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-ink px-6 py-3 text-sm font-bold transition hover:border-purple hover:text-purple"
                >
                  <CalendarDays className="size-4" />
                  Adicionar ao meu Google Calendar
                </a>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-purple"
                >
                  Voltar ao site
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
