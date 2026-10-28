"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  FileText,
  Loader2,
  Plus,
  Search,
  Target,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Btn,
  Card,
  EmptyState,
  Lbl,
  Modal,
  PageHeader,
  inputCls,
} from "../../_components/ui";
import { RESEARCH_TYPES, labelOf } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";

type ResearchItem = {
  id: number;
  type: string;
  title: string;
  content: string | null;
  createdAt: string;
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  concorrencia: <Target className="size-5" />,
  persona: <Users className="size-5" />,
  tendencia: <TrendingUp className="size-5" />,
  inquerito: <FileText className="size-5" />,
  documento: <BookOpen className="size-5" />,
};

export default function PesquisaPage() {
  const [items, setItems] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [viewing, setViewing] = useState<ResearchItem | null>(null);
  const [form, setForm] = useState({ type: "concorrencia", title: "", content: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/research");
    setItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () => (filter ? items.filter((i) => i.type === filter) : items),
    [items, filter]
  );

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setModalOpen(false);
    setForm({ type: "concorrencia", title: "", content: "" });
    load();
  }

  async function remove(id: number) {
    if (!confirm("Eliminar este registo?")) return;
    await fetch(`/api/research?id=${id}`, { method: "DELETE" });
    setViewing(null);
    load();
  }

  return (
    <div>
      <PageHeader
        title="Pesquisa de Mercado"
        subtitle="Concorrência, personas, tendências e feedback — tudo centralizado."
        actions={
          <Btn variant="purple" onClick={() => setModalOpen(true)}>
            <Plus className="size-4" /> Novo registo
          </Btn>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("")}
          className={cn(
            "rounded-full border px-4 py-2 text-xs font-bold transition",
            !filter
              ? "border-purple bg-purple text-white"
              : "border-ink/12 bg-white text-ink/60 hover:border-purple/50"
          )}
        >
          Todos ({items.length})
        </button>
        {RESEARCH_TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(filter === t.id ? "" : t.id)}
            className={cn(
              "rounded-full border px-4 py-2 text-xs font-bold transition",
              filter === t.id
                ? "border-purple bg-purple text-white"
                : "border-ink/12 bg-white text-ink/60 hover:border-purple/50"
            )}
          >
            {t.label} ({items.filter((i) => i.type === t.id).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-ink/50">
          <Loader2 className="size-4 animate-spin" /> A carregar pesquisa…
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="size-6" />}
          title="Sem registos"
          text="Adiciona análises de concorrência, personas ou tendências."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <Card key={item.id} className="group flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple/10">
              <button onClick={() => setViewing(item)} className="block flex-1 text-left">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-purple-soft text-purple">
                    {TYPE_ICON[item.type]}
                  </span>
                  <span className="text-[10px] font-bold tracking-wider text-ink/40 uppercase">
                    {labelOf(RESEARCH_TYPES, item.type)}
                  </span>
                </div>
                <h3 className="font-display mt-4 text-lg leading-snug font-semibold">
                  {item.title}
                </h3>
                {item.content && (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink/55">
                    {item.content}
                  </p>
                )}
                <p className="mt-4 border-t border-ink/6 pt-3 text-[11px] text-ink/40">
                  Adicionado em {formatDate(item.createdAt)}
                </p>
              </button>
            </Card>
          ))}
        </div>
      )}

      {/* Novo registo */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo registo de pesquisa">
        <form onSubmit={create} className="grid gap-4">
          <div>
            <Lbl>Tipo</Lbl>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className={inputCls}
            >
              {RESEARCH_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Lbl>Título</Lbl>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ex.: Análise — Estúdios de branding em Lisboa"
              className={inputCls}
            />
          </div>
          <div>
            <Lbl>Conteúdo / notas / links</Lbl>
            <textarea
              rows={6}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Conclusões, links de referência, prints, resultados de inquéritos…"
              className={cn(inputCls, "resize-none")}
            />
          </div>
          <Btn variant="purple" type="submit" disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Guardar registo
          </Btn>
        </form>
      </Modal>

      {/* Ver registo */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing?.title ?? ""} wide>
        {viewing && (
          <div>
            <p className="text-xs font-bold tracking-wider text-purple uppercase">
              {labelOf(RESEARCH_TYPES, viewing.type)} · {formatDate(viewing.createdAt)}
            </p>
            <p className="mt-4 text-sm leading-relaxed whitespace-pre-wrap text-ink/75">
              {viewing.content || "Sem conteúdo."}
            </p>
            <div className="mt-6 flex justify-end">
              <Btn variant="ghost" onClick={() => remove(viewing.id)}>
                <Trash2 className="size-4" /> Eliminar registo
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
