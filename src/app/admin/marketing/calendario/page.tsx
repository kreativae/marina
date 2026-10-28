"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock,
  Link2,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Badge,
  Btn,
  Card,
  Lbl,
  Modal,
  PageHeader,
  inputCls,
} from "../../_components/ui";
import {
  INSTAGRAM_STAGES,
  PLATFORMS,
  POST_FORMATS,
  labelOf,
} from "@/lib/constants";
import { cn, initials, toYMD } from "@/lib/utils";

type Post = {
  id: number;
  date: string;
  time: string;
  platform: string;
  theme: string;
  format: string;
  copy: string | null;
  hashtags: string | null;
  designLink: string | null;
  owner: string;
  stage: string;
  reach: number;
  engagement: number;
  saves: number;
};

const PLATFORM_CLS: Record<string, string> = {
  instagram: "bg-purple text-white",
  linkedin: "bg-ink text-white",
  email: "bg-grape text-white",
  blog: "bg-ink/10 text-ink",
};

const EMPTY = {
  date: "",
  time: "10:00",
  platform: "instagram",
  theme: "",
  format: "carrossel",
  copy: "",
  hashtags: "",
  designLink: "",
  owner: "Marina",
  stage: "ideia",
};

export default function CalendarioPage() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/posts?month=${monthKey}`);
    setPosts(await res.json());
    setLoading(false);
  }, [monthKey]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(
    () => (platform ? posts.filter((p) => p.platform === platform) : posts),
    [posts, platform]
  );

  const byDate = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const p of visible) {
      const arr = map.get(p.date) ?? [];
      arr.push(p);
      map.set(p.date, arr);
    }
    return map;
  }, [visible]);

  // Grelha do mês, semanas a começar na Segunda
  const cells = useMemo(() => {
    const first = new Date(month);
    const startOffset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - startOffset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [month]);

  const monthLabel = month.toLocaleDateString("pt-PT", {
    month: "long",
    year: "numeric",
  });

  async function createPost(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setModalOpen(false);
    setForm(EMPTY);
    load();
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    const f = new FormData(e.target as HTMLFormElement);
    await fetch("/api/posts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editing.id,
        theme: f.get("theme"),
        date: f.get("date"),
        time: f.get("time"),
        platform: f.get("platform"),
        format: f.get("format"),
        copy: f.get("copy"),
        hashtags: f.get("hashtags"),
        designLink: f.get("designLink"),
        owner: f.get("owner"),
        stage: f.get("stage"),
      }),
    });
    setSaving(false);
    setEditing(null);
    load();
  }

  const today = toYMD(new Date());

  return (
    <div>
      <PageHeader
        title="Calendário Editorial"
        subtitle="Visão mensal das publicações por plataforma — com ficha de conteúdo completa."
        actions={
          <Btn
            variant="purple"
            onClick={() => {
              setForm((f) => ({ ...f, date: today }));
              setModalOpen(true);
            }}
          >
            <Plus className="size-4" /> Nova publicação
          </Btn>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
            }
            className="grid size-10 place-items-center rounded-xl border border-ink/10 bg-white transition hover:border-purple hover:text-purple"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="size-4" />
          </button>
          <p className="font-display w-44 text-center text-lg font-semibold capitalize">
            {monthLabel}
          </p>
          <button
            onClick={() =>
              setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
            }
            className="grid size-10 place-items-center rounded-xl border border-ink/10 bg-white transition hover:border-purple hover:text-purple"
            aria-label="Mês seguinte"
          >
            <ChevronRight className="size-4" />
          </button>
          <button
            onClick={() => {
              const d = new Date();
              setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
            }}
            className="ml-1 rounded-xl border border-ink/10 bg-white px-3.5 py-2 text-xs font-bold transition hover:border-purple hover:text-purple"
          >
            Hoje
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setPlatform("")}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-bold transition",
              !platform
                ? "border-purple bg-purple text-white"
                : "border-ink/12 bg-white text-ink/60 hover:border-purple/50"
            )}
          >
            Todas
          </button>
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPlatform(platform === p.id ? "" : p.id)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-bold transition",
                platform === p.id
                  ? "border-purple bg-purple text-white"
                  : "border-ink/12 bg-white text-ink/60 hover:border-purple/50"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-ink/50">
            <Loader2 className="size-4 animate-spin" /> A carregar calendário…
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 border-b border-ink/8 bg-paper">
              {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
                <p
                  key={d}
                  className="px-3 py-2.5 text-[11px] font-bold tracking-wider text-ink/45 uppercase"
                >
                  {d}
                </p>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((d, i) => {
                const ymd = toYMD(d);
                const inMonth = d.getMonth() === month.getMonth();
                const dayPosts = byDate.get(ymd) ?? [];
                return (
                  <div
                    key={i}
                    onClick={() => {
                      setForm((f) => ({ ...f, date: ymd }));
                      setModalOpen(true);
                    }}
                    className={cn(
                      "min-h-24 cursor-pointer border-r border-b border-ink/6 p-2 transition hover:bg-purple-soft/40",
                      !inMonth && "bg-ink/[0.02]",
                      ymd === today && "bg-purple-soft/60"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "grid size-6 place-items-center rounded-full text-xs font-bold",
                          ymd === today
                            ? "bg-purple text-white"
                            : inMonth
                              ? "text-ink/70"
                              : "text-ink/30"
                        )}
                      >
                        {d.getDate()}
                      </span>
                      {dayPosts.length === 0 && inMonth && (
                        <Plus className="size-3 text-ink/20" />
                      )}
                    </div>
                    <div className="mt-1.5 space-y-1">
                      {dayPosts.slice(0, 3).map((p) => (
                        <button
                          key={p.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditing(p);
                          }}
                          className={cn(
                            "block w-full truncate rounded-md px-2 py-1 text-left text-[10px] font-bold",
                            PLATFORM_CLS[p.platform] ?? "bg-ink/10 text-ink",
                            p.stage === "publicado" || p.stage === "analisado"
                              ? "opacity-100"
                              : "opacity-75"
                          )}
                        >
                          {p.time} · {p.theme}
                        </button>
                      ))}
                      {dayPosts.length > 3 && (
                        <p className="px-1 text-[10px] font-bold text-ink/40">
                          +{dayPosts.length - 3} mais
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {/* Legenda */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink/55">
        {PLATFORMS.map((p) => (
          <span key={p.id} className="flex items-center gap-1.5">
            <span className={cn("size-3 rounded", PLATFORM_CLS[p.id])} />
            {p.label}
          </span>
        ))}
      </div>

      {/* Modal nova publicação (ficha B5) */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova publicação" wide>
        <form onSubmit={createPost} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Lbl>Data</Lbl>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <Lbl>Hora</Lbl>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <Lbl>Responsável</Lbl>
              <input
                value={form.owner}
                onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <Lbl>Tema</Lbl>
            <input
              required
              value={form.theme}
              onChange={(e) => setForm((f) => ({ ...f, theme: e.target.value }))}
              placeholder="Ex.: Como definir a tua identidade visual"
              className={inputCls}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Lbl>Plataforma</Lbl>
              <select
                value={form.platform}
                onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
                className={inputCls}
              >
                {PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Lbl>Formato</Lbl>
              <select
                value={form.format}
                onChange={(e) => setForm((f) => ({ ...f, format: e.target.value }))}
                className={inputCls}
              >
                {POST_FORMATS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Lbl>Estado</Lbl>
              <select
                value={form.stage}
                onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))}
                className={inputCls}
              >
                {INSTAGRAM_STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Lbl>Copy / Legenda</Lbl>
            <textarea
              rows={3}
              value={form.copy}
              onChange={(e) => setForm((f) => ({ ...f, copy: e.target.value }))}
              className={cn(inputCls, "resize-none")}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Lbl>Hashtags</Lbl>
              <input
                value={form.hashtags}
                onChange={(e) => setForm((f) => ({ ...f, hashtags: e.target.value }))}
                placeholder="#design #branding #identidadevisual"
                className={inputCls}
              />
            </div>
            <div>
              <Lbl>Design (link Canva/Figma)</Lbl>
              <input
                value={form.designLink}
                onChange={(e) => setForm((f) => ({ ...f, designLink: e.target.value }))}
                placeholder="https://…"
                className={inputCls}
              />
            </div>
          </div>
          <Btn variant="purple" type="submit" disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Agendar publicação
          </Btn>
        </form>
      </Modal>

      {/* Modal ficha completa */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Ficha de conteúdo" wide>
        {editing && (
          <form onSubmit={saveEdit} className="grid gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="purple">{labelOf(PLATFORMS, editing.platform)}</Badge>
              <Badge tone="dark">{labelOf(POST_FORMATS, editing.format)}</Badge>
              <Badge tone="neutral">
                {labelOf(INSTAGRAM_STAGES, editing.stage)}
              </Badge>
              <span className="ml-auto flex items-center gap-1.5 text-xs text-ink/50">
                <Clock className="size-3.5" />
                {editing.date} · {editing.time} · {initials(editing.owner)} {editing.owner}
              </span>
            </div>
            <div>
              <Lbl>Tema</Lbl>
              <input name="theme" defaultValue={editing.theme} className={inputCls} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Lbl>Data</Lbl>
                <input name="date" type="date" defaultValue={editing.date} className={inputCls} />
              </div>
              <div>
                <Lbl>Hora</Lbl>
                <input name="time" type="time" defaultValue={editing.time} className={inputCls} />
              </div>
              <div>
                <Lbl>Responsável</Lbl>
                <input name="owner" defaultValue={editing.owner} className={inputCls} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Lbl>Plataforma</Lbl>
                <select name="platform" defaultValue={editing.platform} className={inputCls}>
                  {PLATFORMS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Lbl>Formato</Lbl>
                <select name="format" defaultValue={editing.format} className={inputCls}>
                  {POST_FORMATS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Lbl>Estado</Lbl>
                <select name="stage" defaultValue={editing.stage} className={inputCls}>
                  {INSTAGRAM_STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Lbl>Copy / Legenda</Lbl>
              <textarea name="copy" rows={4} defaultValue={editing.copy ?? ""} className={cn(inputCls, "resize-none")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Lbl>Hashtags</Lbl>
                <input name="hashtags" defaultValue={editing.hashtags ?? ""} className={inputCls} />
              </div>
              <div>
                <Lbl>Design</Lbl>
                <input name="designLink" defaultValue={editing.designLink ?? ""} className={inputCls} />
              </div>
            </div>
            {editing.designLink && (
              <a
                href={editing.designLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-purple"
              >
                <Link2 className="size-3.5" /> Abrir ficheiro de design
              </a>
            )}
            <div className="flex items-center justify-between gap-3">
              <Btn
                variant="ghost"
                onClick={async () => {
                  if (!confirm("Eliminar esta publicação?")) return;
                  await fetch(`/api/posts?id=${editing.id}`, { method: "DELETE" });
                  setEditing(null);
                  load();
                }}
              >
                <Trash2 className="size-4" /> Eliminar
              </Btn>
              <Btn variant="purple" type="submit" disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <CalendarRange className="size-4" />}
                Guardar ficha
              </Btn>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
