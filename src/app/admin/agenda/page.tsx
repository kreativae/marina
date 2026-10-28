"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Loader2,
  MessageCircle,
  Plus,
  RefreshCw,
  Trash2,
  Video,
  XCircle,
} from "lucide-react";
import {
  Badge,
  Btn,
  Card,
  EmptyState,
  Lbl,
  Modal,
  PageHeader,
  inputCls,
} from "../_components/ui";
import { cn, formatDate, toYMD, whatsappLink } from "@/lib/utils";

type EventTypeT = {
  id: number;
  name: string;
  slug: string;
  duration: number;
  description: string | null;
  tagPreset: string;
  active: boolean;
};

type BookingT = {
  id: number;
  eventTypeId: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  date: string;
  startTime: string;
  status: string;
  zoomLink: string | null;
  googleSynced: boolean;
  zoomSentEmail: boolean;
  linkSentWhatsapp: boolean;
};

type BookingRow = { booking: BookingT; eventType: EventTypeT };

type WindowT = {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
};

type BlockT = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
};

const TABS = [
  { id: "agendamentos", label: "Agendamentos" },
  { id: "tipos", label: "Tipos de sessão" },
  { id: "disponibilidade", label: "Disponibilidade semanal" },
  { id: "google", label: "Google Calendar" },
] as const;

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function AgendaPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("agendamentos");
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [types, setTypes] = useState<EventTypeT[]>([]);
  const [windows, setWindows] = useState<WindowT[]>([]);
  const [blocks, setBlocks] = useState<BlockT[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<number | null>(null);
  const [typeModal, setTypeModal] = useState(false);
  const [windowForm, setWindowForm] = useState({ dayOfWeek: "1", startTime: "09:30", endTime: "12:30" });
  const [blockForm, setBlockForm] = useState({ date: toYMD(new Date()), startTime: "12:00", endTime: "13:00", reason: "" });
  const [typeForm, setTypeForm] = useState({ name: "", duration: "60", description: "", tagPreset: "mentoria" });
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    const [b, t, w, bl] = await Promise.all([
      fetch("/api/bookings").then((r) => r.json()),
      fetch("/api/event-types?all=1").then((r) => r.json()),
      fetch("/api/availability-config").then((r) => r.json()),
      fetch("/api/blocked-slots").then((r) => r.json()),
    ]);
    setBookings(b);
    setTypes(t);
    setWindows(w);
    setBlocks(bl);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upcoming = useMemo(() => {
    const today = toYMD(new Date());
    return bookings.filter(
      (r) => r.booking.date >= today && r.booking.status !== "cancelado"
    );
  }, [bookings]);

  const past = useMemo(() => {
    const today = toYMD(new Date());
    return bookings.filter(
      (r) => r.booking.date < today || r.booking.status === "cancelado"
    );
  }, [bookings]);

  async function patchBooking(id: number, patch: Record<string, unknown>) {
    await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    load();
  }

  async function addWindow(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/availability-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dayOfWeek: Number(windowForm.dayOfWeek),
        startTime: windowForm.startTime,
        endTime: windowForm.endTime,
      }),
    });
    load();
  }

  async function addBlock(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/blocked-slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(blockForm),
    });
    load();
  }

  async function addType(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/event-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: typeForm.name,
        duration: Number(typeForm.duration),
        description: typeForm.description || null,
        tagPreset: typeForm.tagPreset,
      }),
    });
    setTypeModal(false);
    setTypeForm({ name: "", duration: "60", description: "", tagPreset: "mentoria" });
    load();
  }

  function syncNow() {
    setSyncing(true);
    setTimeout(() => {
      setLastSync(new Date().toLocaleString("pt-PT"));
      setSyncing(false);
    }, 1400);
  }

  return (
    <div>
      <PageHeader
        title="Agenda & Sessões"
        subtitle="Gestor de agendamento nativo (substitui o Calendly) — com Zoom e Google Calendar sincronizados."
        actions={
          <>
            <a
              href="/agendar"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-ink/12 bg-white px-4 py-2.5 text-sm font-bold transition hover:border-purple hover:text-purple"
            >
              Página pública <ExternalLink className="size-4" />
            </a>
            <Btn variant="purple" onClick={() => setTypeModal(true)}>
              <Plus className="size-4" /> Novo tipo de sessão
            </Btn>
          </>
        }
      />

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-full border px-4 py-2 text-xs font-bold transition",
              tab === t.id
                ? "border-purple bg-purple text-white"
                : "border-ink/12 bg-white text-ink/60 hover:border-purple/50"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-ink/50">
          <Loader2 className="size-4 animate-spin" /> A carregar agenda…
        </div>
      ) : (
        <>
          {/* ——— TAB: AGENDAMENTOS ——— */}
          {tab === "agendamentos" && (
            <div className="space-y-6">
              <Card className="p-5">
                <h3 className="font-display mb-4 text-lg font-semibold">
                  Próximas sessões ({upcoming.length})
                </h3>
                <div className="space-y-3">
                  {upcoming.length === 0 && (
                    <EmptyState
                      icon={<CalendarDays className="size-6" />}
                      title="Sem sessões futuras"
                      text="Partilha a página /agendar para receber marcações."
                    />
                  )}
                  {upcoming.map(({ booking: b, eventType: ev }) => (
                    <div
                      key={b.id}
                      className="flex flex-wrap items-center gap-4 rounded-2xl border border-ink/8 bg-paper p-4"
                    >
                      <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-ink text-center text-white">
                        <div>
                          <p className="font-display text-lg leading-none font-bold">
                            {b.date.slice(8, 10)}
                          </p>
                          <p className="text-[9px] font-bold uppercase opacity-70">
                            {new Date(`${b.date}T12:00`).toLocaleDateString("pt-PT", { month: "short" })}
                          </p>
                        </div>
                      </div>
                      <div className="min-w-40 flex-1">
                        <p className="font-bold">{b.contactName}</p>
                        <p className="text-xs text-ink/50">
                          {ev.name} · {b.startTime} · {ev.duration} min
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <Badge tone={b.status === "confirmado" ? "green" : "neutral"}>
                            {b.status}
                          </Badge>
                          {b.googleSynced && (
                            <Badge tone="purple">
                              <CalendarDays className="size-3" /> Google
                            </Badge>
                          )}
                          {b.zoomSentEmail && (
                            <Badge tone="outline">Link enviado por e-mail</Badge>
                          )}
                          {b.linkSentWhatsapp && (
                            <Badge tone="outline">Link enviado por WhatsApp</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(b.zoomLink ?? "");
                            setCopied(b.id);
                            setTimeout(() => setCopied(null), 1500);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-ink/12 bg-white px-3 py-2 text-xs font-bold transition hover:border-purple hover:text-purple"
                        >
                          {copied === b.id ? (
                            <Check className="size-3.5" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                          Zoom
                        </button>
                        {b.contactPhone && (
                          <a
                            href={whatsappLink(
                              b.contactPhone,
                              `Olá ${b.contactName.split(" ")[0]}! Aqui está o link Zoom da nossa sessão (${formatDate(b.date)} às ${b.startTime}): ${b.zoomLink}`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() =>
                              !b.linkSentWhatsapp &&
                              patchBooking(b.id, { linkSentWhatsapp: true })
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-bold text-white transition hover:bg-purple"
                          >
                            <MessageCircle className="size-3.5" /> Reenviar link
                          </a>
                        )}
                        <button
                          onClick={() => patchBooking(b.id, { status: "concluido" })}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50"
                        >
                          <CheckCircle2 className="size-3.5" /> Concluir
                        </button>
                        <button
                          onClick={() => patchBooking(b.id, { status: "cancelado" })}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50"
                        >
                          <XCircle className="size-3.5" /> Cancelar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {past.length > 0 && (
                <Card className="p-5">
                  <h3 className="font-display mb-4 text-lg font-semibold text-ink/60">
                    Histórico
                  </h3>
                  <div className="space-y-2">
                    {past.slice(0, 8).map(({ booking: b, eventType: ev }) => (
                      <div
                        key={b.id}
                        className="flex flex-wrap items-center gap-3 rounded-xl bg-paper px-4 py-3 text-sm"
                      >
                        <span className="font-medium text-ink/50">
                          {formatDate(b.date)} · {b.startTime}
                        </span>
                        <span className="font-bold">{b.contactName}</span>
                        <span className="text-xs text-ink/45">{ev.name}</span>
                        <span className="ml-auto">
                          <Badge
                            tone={
                              b.status === "concluido"
                                ? "green"
                                : b.status === "cancelado"
                                  ? "red"
                                  : "neutral"
                            }
                          >
                            {b.status}
                          </Badge>
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ——— TAB: TIPOS DE SESSÃO (A3) ——— */}
          {tab === "tipos" && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {types.map((t) => (
                <Card key={t.id} className={cn("p-5", !t.active && "opacity-55")}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-semibold">{t.name}</p>
                      <p className="mt-0.5 font-mono text-xs text-ink/40">
                        /agendar · {t.slug}
                      </p>
                    </div>
                    <span className="grid size-10 place-items-center rounded-xl bg-purple-soft text-purple">
                      <Clock className="size-5" />
                    </span>
                  </div>
                  {t.description && (
                    <p className="mt-3 text-sm text-ink/55">{t.description}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between border-t border-ink/8 pt-4">
                    <Badge tone="purple">{t.duration} min</Badge>
                    <Badge tone="neutral">#{t.tagPreset}</Badge>
                    <button
                      onClick={async () => {
                        await fetch("/api/event-types", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: t.id, active: !t.active }),
                        });
                        load();
                      }}
                      className={cn(
                        "rounded-full px-3.5 py-1.5 text-xs font-bold transition",
                        t.active
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-ink/8 text-ink/50"
                      )}
                    >
                      {t.active ? "Ativo" : "Inativo"}
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* ——— TAB: DISPONIBILIDADE (A3) ——— */}
          {tab === "disponibilidade" && (
            <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {WEEKDAYS.map((day, idx) => {
                  const dayWindows = windows.filter((w) => w.dayOfWeek === idx);
                  return (
                    <Card key={day} className="p-4">
                      <p className="text-xs font-bold tracking-wider text-ink/50 uppercase">
                        {day}
                      </p>
                      <div className="mt-3 space-y-2">
                        {dayWindows.length === 0 && (
                          <p className="rounded-lg bg-paper px-3 py-2 text-xs text-ink/40">
                            Indisponível
                          </p>
                        )}
                        {dayWindows.map((w) => (
                          <div
                            key={w.id}
                            className="flex items-center justify-between rounded-lg bg-purple-soft px-3 py-2"
                          >
                            <span className="text-sm font-bold text-purple">
                              {w.startTime} – {w.endTime}
                            </span>
                            <button
                              onClick={async () => {
                                await fetch(`/api/availability-config?id=${w.id}`, {
                                  method: "DELETE",
                                });
                                load();
                              }}
                              className="text-purple/50 transition hover:text-purple"
                              aria-label="Remover janela"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>
              <Card className="h-fit p-5">
                <h3 className="font-display text-lg font-semibold">
                  Adicionar janela
                </h3>
                <form onSubmit={addWindow} className="mt-4 grid gap-3">
                  <div>
                    <Lbl>Dia da semana</Lbl>
                    <select
                      value={windowForm.dayOfWeek}
                      onChange={(e) =>
                        setWindowForm((f) => ({ ...f, dayOfWeek: e.target.value }))
                      }
                      className={inputCls}
                    >
                      {WEEKDAYS.map((d, i) => (
                        <option key={d} value={i}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Lbl>Início</Lbl>
                      <input
                        type="time"
                        value={windowForm.startTime}
                        onChange={(e) =>
                          setWindowForm((f) => ({ ...f, startTime: e.target.value }))
                        }
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <Lbl>Fim</Lbl>
                      <input
                        type="time"
                        value={windowForm.endTime}
                        onChange={(e) =>
                          setWindowForm((f) => ({ ...f, endTime: e.target.value }))
                        }
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <Btn variant="purple" type="submit">
                    <Plus className="size-4" /> Adicionar
                  </Btn>
                </form>
              </Card>
            </div>
          )}

          {/* ——— TAB: GOOGLE CALENDAR (A4) ——— */}
          {tab === "google" && (
            <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
              <Card className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-xl font-semibold">
                      Sincronização bidirecional
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink/55">
                      Cada agendamento cria um evento no Google Calendar da
                      Marina. Bloqueios do Google refletem-se como
                      indisponibilidade na página pública.
                    </p>
                  </div>
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-purple text-white">
                    <CalendarDays className="size-5" />
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Btn variant="primary" onClick={syncNow} disabled={syncing}>
                    <RefreshCw className={cn("size-4", syncing && "animate-spin")} />
                    {syncing ? "A sincronizar…" : "Sincronizar agora"}
                  </Btn>
                  <p className="text-xs text-ink/45">
                    {lastSync
                      ? `Última sync manual: ${lastSync}`
                      : "Sync automática a cada 5 minutos"}
                  </p>
                </div>
                <div className="mt-6 space-y-2.5">
                  <p className="text-xs font-bold tracking-wider text-ink/45 uppercase">
                    Eventos criados pelo gestor ({bookings.filter((r) => r.booking.googleSynced && r.booking.status !== "cancelado").length})
                  </p>
                  {bookings
                    .filter((r) => r.booking.googleSynced && r.booking.status !== "cancelado")
                    .slice(0, 6)
                    .map(({ booking: b, eventType: ev }) => (
                      <div
                        key={b.id}
                        className="flex items-center gap-3 rounded-xl bg-paper px-4 py-3 text-sm"
                      >
                        <Check className="size-4 shrink-0 text-purple" />
                        <span className="font-medium">
                          {ev.name} — {b.contactName}
                        </span>
                        <span className="ml-auto text-xs text-ink/45">
                          {formatDate(b.date)} · {b.startTime}
                        </span>
                      </div>
                    ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-display text-xl font-semibold">
                  Bloqueios do Google
                </h3>
                <p className="mt-1 text-sm text-ink/55">
                  Intervalos importados do Google Calendar que bloqueiam a
                  agenda pública.
                </p>
                <div className="mt-4 space-y-2">
                  {blocks.length === 0 && (
                    <p className="rounded-xl bg-paper px-4 py-3 text-sm text-ink/45">
                      Sem bloqueios ativos.
                    </p>
                  )}
                  {blocks.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center gap-3 rounded-xl border border-ink/8 bg-paper px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold">
                          {formatDate(b.date)} · {b.startTime}–{b.endTime}
                        </p>
                        <p className="truncate text-xs text-ink/50">
                          {b.reason || "Ocupado (Google Calendar)"}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          await fetch(`/api/blocked-slots?id=${b.id}`, {
                            method: "DELETE",
                          });
                          load();
                        }}
                        className="text-ink/35 transition hover:text-red-600"
                        aria-label="Remover bloqueio"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <form onSubmit={addBlock} className="mt-5 grid gap-3 rounded-xl border border-dashed border-ink/15 p-4">
                  <p className="text-xs font-bold tracking-wider text-ink/45 uppercase">
                    Simular bloqueio importado
                  </p>
                  <div>
                    <Lbl>Data</Lbl>
                    <input
                      type="date"
                      value={blockForm.date}
                      onChange={(e) =>
                        setBlockForm((f) => ({ ...f, date: e.target.value }))
                      }
                      className={inputCls}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Lbl>Início</Lbl>
                      <input
                        type="time"
                        value={blockForm.startTime}
                        onChange={(e) =>
                          setBlockForm((f) => ({ ...f, startTime: e.target.value }))
                        }
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <Lbl>Fim</Lbl>
                      <input
                        type="time"
                        value={blockForm.endTime}
                        onChange={(e) =>
                          setBlockForm((f) => ({ ...f, endTime: e.target.value }))
                        }
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <input
                    value={blockForm.reason}
                    onChange={(e) =>
                      setBlockForm((f) => ({ ...f, reason: e.target.value }))
                    }
                    placeholder="Motivo (ex.: Almoço de equipa)"
                    className={inputCls}
                  />
                  <Btn variant="ghost" type="submit">
                    <Plus className="size-4" /> Adicionar bloqueio
                  </Btn>
                </form>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Modal novo tipo */}
      <Modal open={typeModal} onClose={() => setTypeModal(false)} title="Novo tipo de sessão">
        <form onSubmit={addType} className="grid gap-4">
          <div>
            <Lbl>Nome</Lbl>
            <input
              required
              value={typeForm.name}
              onChange={(e) => setTypeForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex.: Sessão de Mentoria"
              className={inputCls}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Lbl>Duração (min)</Lbl>
              <input
                type="number"
                min="15"
                step="15"
                required
                value={typeForm.duration}
                onChange={(e) => setTypeForm((f) => ({ ...f, duration: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <Lbl>Tag automática</Lbl>
              <select
                value={typeForm.tagPreset}
                onChange={(e) => setTypeForm((f) => ({ ...f, tagPreset: e.target.value }))}
                className={inputCls}
              >
                <option value="mentoria">#mentoria</option>
                <option value="workshop">#workshop</option>
                <option value="design">#design</option>
              </select>
            </div>
          </div>
          <div>
            <Lbl>Descrição</Lbl>
            <textarea
              rows={3}
              value={typeForm.description}
              onChange={(e) => setTypeForm((f) => ({ ...f, description: e.target.value }))}
              className={cn(inputCls, "resize-none")}
            />
          </div>
          <Btn variant="purple" type="submit">
            <Video className="size-4" /> Criar tipo de sessão
          </Btn>
        </form>
      </Modal>
    </div>
  );
}
