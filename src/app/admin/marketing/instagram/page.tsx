"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bookmark,
  CalendarDays,
  Camera,
  Eye,
  Heart,
  LayoutList,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import KanbanBoard from "../../_components/kanban";
import {
  Badge,
  Btn,
  Card,
  EmptyState,
  Lbl,
  Modal,
  PageHeader,
  StatCard,
  inputCls,
} from "../../_components/ui";
import { INSTAGRAM_STAGES, POST_FORMATS, labelOf } from "@/lib/constants";
import { cn, formatDate, toYMD } from "@/lib/utils";

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

const EMPTY = { date: "", theme: "", format: "carrossel", copy: "", hashtags: "" };

const DOTS = ["#e3d3e4", "#d3b4d3", "#b266b2", "#800080", "#5c005c", "#0a0a0b", "#3a3a3c"];

export default function InstagramPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "lista">("kanban");
  const [formatFilter, setFormatFilter] = useState("");
  const [period, setPeriod] = useState<"tudo" | "semana" | "mes">("tudo");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/posts?platform=instagram");
    setPosts(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let list = posts;
    if (formatFilter) list = list.filter((p) => p.format === formatFilter);
    const today = new Date();
    if (period === "semana") {
      const start = toYMD(new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 1));
      const end = toYMD(new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 7));
      list = list.filter((p) => p.date >= start && p.date <= end);
    }
    if (period === "mes") {
      const key = toYMD(today).slice(0, 7);
      list = list.filter((p) => p.date.slice(0, 7) === key);
    }
    return list;
  }, [posts, formatFilter, period]);

  const published = posts.filter((p) =>
    ["publicado", "analisado"].includes(p.stage)
  );
  const totalReach = published.reduce((s, p) => s + p.reach, 0);
  const totalSaves = published.reduce((s, p) => s + p.saves, 0);
  const avgEngagement = published.length
    ? (published.reduce((s, p) => s + p.engagement, 0) / published.length).toFixed(1)
    : "0";

  async function move(id: number, stage: string) {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, stage } : p)));
    await fetch("/api/posts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, stage }),
    });
  }

  async function createPost(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, platform: "instagram" }),
    });
    setSaving(false);
    setModalOpen(false);
    setForm(EMPTY);
    load();
  }

  async function saveMetrics(e: React.FormEvent) {
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
        copy: f.get("copy"),
        stage: f.get("stage"),
        reach: f.get("reach"),
        engagement: f.get("engagement"),
        saves: f.get("saves"),
      }),
    });
    setSaving(false);
    setEditing(null);
    load();
  }

  return (
    <div>
      <PageHeader
        title="Esteira Instagram"
        subtitle="Da ideia à análise — o fluxo completo de produção de conteúdo."
        actions={
          <>
            <div className="flex overflow-hidden rounded-xl border border-ink/12 bg-white">
              {(
                [
                  ["kanban", Camera, "Kanban"],
                  ["lista", LayoutList, "Lista"],
                ] as const
              ).map(([v, Icon, label]) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold transition",
                    view === v ? "bg-purple text-white" : "text-ink/55 hover:text-purple"
                  )}
                >
                  <Icon className="size-3.5" /> {label}
                </button>
              ))}
            </div>
            <Btn
              variant="purple"
              onClick={() => {
                setForm((f) => ({ ...f, date: toYMD(new Date()) }));
                setModalOpen(true);
              }}
            >
              <Plus className="size-4" /> Novo post
            </Btn>
          </>
        }
      />

      {/* Métricas */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Alcance total"
          value={totalReach.toLocaleString("pt-PT")}
          hint={`${published.length} posts publicados`}
          icon={<Eye className="size-5" />}
        />
        <StatCard
          label="Engagement médio"
          value={`${avgEngagement}%`}
          hint="Interações / alcance"
          icon={<Heart className="size-5" />}
          accent
        />
        <StatCard
          label="Saves totais"
          value={totalSaves.toLocaleString("pt-PT")}
          hint="Guardados pelos seguidores"
          icon={<Bookmark className="size-5" />}
        />
        <StatCard
          label="Em produção"
          value={String(posts.filter((p) => !["publicado", "analisado"].includes(p.stage)).length)}
          hint="Na esteira agora"
          icon={<BarChart3 className="size-5" />}
          accent
        />
      </div>

      {/* Filtros */}
      <div className="mb-5 flex flex-wrap gap-2">
        {(
          [
            ["tudo", "Tudo"],
            ["semana", "Esta semana"],
            ["mes", "Este mês"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setPeriod(v)}
            className={cn(
              "rounded-full border px-4 py-2 text-xs font-bold transition",
              period === v
                ? "border-ink bg-ink text-white"
                : "border-ink/12 bg-white text-ink/60 hover:border-ink/40"
            )}
          >
            {label}
          </button>
        ))}
        <span className="mx-1 hidden w-px bg-ink/12 sm:block" />
        <button
          onClick={() => setFormatFilter("")}
          className={cn(
            "rounded-full border px-4 py-2 text-xs font-bold transition",
            !formatFilter
              ? "border-purple bg-purple text-white"
              : "border-ink/12 bg-white text-ink/60 hover:border-purple/50"
          )}
        >
          Formatos
        </button>
        {POST_FORMATS.filter((f) =>
          ["reels", "carrossel", "story", "post"].includes(f.id)
        ).map((f) => (
          <button
            key={f.id}
            onClick={() => setFormatFilter(formatFilter === f.id ? "" : f.id)}
            className={cn(
              "rounded-full border px-4 py-2 text-xs font-bold transition",
              formatFilter === f.id
                ? "border-purple bg-purple text-white"
                : "border-ink/12 bg-white text-ink/60 hover:border-purple/50"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-ink/50">
          <Loader2 className="size-4 animate-spin" /> A carregar esteira…
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Camera className="size-6" />}
          title="Sem posts neste filtro"
          text="Cria o primeiro post da esteira ou ajusta os filtros."
        />
      ) : view === "kanban" ? (
        <KanbanBoard
          columns={INSTAGRAM_STAGES}
          items={filtered}
          onMove={move}
          accentDot={(_, i) => DOTS[i]}
          renderCard={(p) => (
            <Card className="p-4 transition hover:shadow-md hover:shadow-purple/10">
              <button onClick={() => setEditing(p)} className="block w-full text-left">
                <div className="flex items-center justify-between gap-2">
                  <Badge tone="purple">{labelOf(POST_FORMATS, p.format)}</Badge>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-ink/40">
                    <CalendarDays className="size-3" />
                    {formatDate(p.date)}
                  </span>
                </div>
                <p className="mt-2.5 text-sm leading-snug font-bold">{p.theme}</p>
                {p.hashtags && (
                  <p className="mt-1.5 truncate font-mono text-[10px] text-purple/70">
                    {p.hashtags}
                  </p>
                )}
                {["publicado", "analisado"].includes(p.stage) && (
                  <div className="mt-3 flex items-center gap-3 border-t border-ink/6 pt-2.5 text-[11px] font-semibold text-ink/55">
                    <span className="flex items-center gap-1">
                      <Eye className="size-3" /> {p.reach.toLocaleString("pt-PT")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="size-3" /> {p.engagement}%
                    </span>
                    <span className="flex items-center gap-1">
                      <Bookmark className="size-3" /> {p.saves}
                    </span>
                  </div>
                )}
              </button>
            </Card>
          )}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-ink/8 text-left text-[11px] font-bold tracking-wider text-ink/45 uppercase">
                  <th className="px-5 py-3.5">Data</th>
                  <th className="px-4 py-3.5">Tema</th>
                  <th className="px-4 py-3.5">Formato</th>
                  <th className="px-4 py-3.5">Estado</th>
                  <th className="px-4 py-3.5 text-right">Alcance</th>
                  <th className="px-5 py-3.5 text-right">Saves</th>
                </tr>
              </thead>
              <tbody>
                {[...filtered]
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => setEditing(p)}
                      className="cursor-pointer border-b border-ink/5 transition last:border-0 hover:bg-purple-soft/50"
                    >
                      <td className="px-5 py-3.5 font-semibold whitespace-nowrap">
                        {formatDate(p.date)}
                      </td>
                      <td className="px-4 py-3.5 font-bold">{p.theme}</td>
                      <td className="px-4 py-3.5">
                        <Badge tone="purple">{labelOf(POST_FORMATS, p.format)}</Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge tone={p.stage === "publicado" || p.stage === "analisado" ? "green" : "outline"}>
                          {labelOf(INSTAGRAM_STAGES, p.stage)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold">
                        {p.reach > 0 ? p.reach.toLocaleString("pt-PT") : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold">
                        {p.saves > 0 ? p.saves : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Novo post */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo post Instagram">
        <form onSubmit={createPost} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Lbl>Data prevista</Lbl>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <Lbl>Formato</Lbl>
              <select
                value={form.format}
                onChange={(e) => setForm((f) => ({ ...f, format: e.target.value }))}
                className={inputCls}
              >
                {POST_FORMATS.filter((f) =>
                  ["reels", "carrossel", "story", "post"].includes(f.id)
                ).map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Lbl>Tema</Lbl>
            <input
              required
              value={form.theme}
              onChange={(e) => setForm((f) => ({ ...f, theme: e.target.value }))}
              placeholder="Ex.: 3 erros ao escolher tipografia"
              className={inputCls}
            />
          </div>
          <div>
            <Lbl>Ideia de copy</Lbl>
            <textarea
              rows={3}
              value={form.copy}
              onChange={(e) => setForm((f) => ({ ...f, copy: e.target.value }))}
              className={cn(inputCls, "resize-none")}
            />
          </div>
          <div>
            <Lbl>Hashtags</Lbl>
            <input
              value={form.hashtags}
              onChange={(e) => setForm((f) => ({ ...f, hashtags: e.target.value }))}
              placeholder="#design #branding"
              className={inputCls}
            />
          </div>
          <Btn variant="purple" type="submit" disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Adicionar à esteira
          </Btn>
        </form>
      </Modal>

      {/* Editar / métricas */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.theme ?? ""}>
        {editing && (
          <form onSubmit={saveMetrics} className="grid gap-4">
            <div>
              <Lbl>Tema</Lbl>
              <input name="theme" defaultValue={editing.theme} className={inputCls} />
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
            <div>
              <Lbl>Copy</Lbl>
              <textarea name="copy" rows={3} defaultValue={editing.copy ?? ""} className={cn(inputCls, "resize-none")} />
            </div>
            <div className="rounded-2xl bg-purple-soft p-4">
              <p className="mb-3 text-xs font-bold tracking-wider text-purple uppercase">
                Métricas pós-publicação
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Lbl>Alcance</Lbl>
                  <input name="reach" type="number" min="0" defaultValue={editing.reach} className={inputCls} />
                </div>
                <div>
                  <Lbl>Engagement %</Lbl>
                  <input name="engagement" type="number" min="0" step="0.1" defaultValue={editing.engagement} className={inputCls} />
                </div>
                <div>
                  <Lbl>Saves</Lbl>
                  <input name="saves" type="number" min="0" defaultValue={editing.saves} className={inputCls} />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Btn
                variant="ghost"
                onClick={async () => {
                  if (!confirm("Eliminar este post?")) return;
                  await fetch(`/api/posts?id=${editing.id}`, { method: "DELETE" });
                  setEditing(null);
                  load();
                }}
              >
                <Trash2 className="size-4" /> Eliminar
              </Btn>
              <Btn variant="purple" type="submit" disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : "Guardar"}
              </Btn>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
