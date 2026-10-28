"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Loader2, Plus, Trash2, User } from "lucide-react";
import KanbanBoard from "../_components/kanban";
import {
  Btn,
  Card,
  Lbl,
  Modal,
  PageHeader,
  inputCls,
} from "../_components/ui";
import { MARKETING_STAGES } from "@/lib/constants";
import { cn, formatDate, initials } from "@/lib/utils";

type Task = {
  id: number;
  title: string;
  owner: string;
  deadline: string | null;
  stage: string;
  notes: string | null;
  createdAt: string;
};

const EMPTY = { title: "", owner: "Marina", deadline: "", notes: "" };

export default function MarketingPipelinePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/marketing-tasks");
    setTasks(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function move(id: number, stage: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, stage } : t)));
    await fetch("/api/marketing-tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, stage }),
    });
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/marketing-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        owner: form.owner,
        deadline: form.deadline || null,
        notes: form.notes || null,
      }),
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
    await fetch("/api/marketing-tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editing.id,
        title: f.get("title"),
        owner: f.get("owner"),
        deadline: f.get("deadline") || null,
        stage: f.get("stage"),
        notes: f.get("notes") || null,
      }),
    });
    setSaving(false);
    setEditing(null);
    load();
  }

  return (
    <div>
      <PageHeader
        title="Pipeline de Marketing"
        subtitle="Projetos e processos criativos — da ideia à publicação."
        actions={
          <Btn variant="purple" onClick={() => setModalOpen(true)}>
            <Plus className="size-4" /> Novo projeto
          </Btn>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-ink/50">
          <Loader2 className="size-4 animate-spin" /> A carregar pipeline…
        </div>
      ) : (
        <KanbanBoard
          columns={MARKETING_STAGES}
          items={tasks}
          onMove={move}
          accentDot={(_, i) =>
            ["#e3d3e4", "#b266b2", "#800080", "#5c005c", "#0a0a0b", "#3a3a3c"][i]
          }
          renderCard={(t) => {
            const overdue =
              t.deadline &&
              t.deadline < new Date().toISOString().slice(0, 10) &&
              t.stage !== "publicado";
            return (
              <Card className={cn("p-4 transition hover:shadow-md hover:shadow-purple/10", overdue && "ring-1 ring-red-300")}>
                <button onClick={() => setEditing(t)} className="block w-full text-left">
                  <p className="text-sm leading-snug font-bold">{t.title}</p>
                  {t.notes && (
                    <p className="mt-1.5 line-clamp-2 text-xs text-ink/50">
                      {t.notes}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between border-t border-ink/6 pt-2.5">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-ink/60">
                      <span className="grid size-5.5 place-items-center rounded-full bg-ink text-[9px] font-bold text-white">
                        {initials(t.owner)}
                      </span>
                      {t.owner}
                    </span>
                    <span
                      className={cn(
                        "flex items-center gap-1 text-[11px]",
                        overdue ? "font-bold text-red-600" : "text-ink/45"
                      )}
                    >
                      <CalendarDays className="size-3" />
                      {formatDate(t.deadline)}
                    </span>
                  </div>
                </button>
              </Card>
            );
          }}
        />
      )}

      {/* Novo projeto */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo projeto de marketing">
        <form onSubmit={createTask} className="grid gap-4">
          <div>
            <Lbl>Nome do projeto / campanha</Lbl>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ex.: Sequência de e-mails pós-webinar"
              className={inputCls}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Lbl>Responsável</Lbl>
              <input
                value={form.owner}
                onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <Lbl>Prazo</Lbl>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <Lbl>Notas & anexos</Lbl>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Links de referência, briefings, anexos…"
              className={cn(inputCls, "resize-none")}
            />
          </div>
          <Btn variant="purple" type="submit" disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Criar projeto
          </Btn>
        </form>
      </Modal>

      {/* Editar */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.title ?? ""}>
        {editing && (
          <form onSubmit={saveEdit} className="grid gap-4">
            <div>
              <Lbl>Nome</Lbl>
              <input name="title" defaultValue={editing.title} className={inputCls} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Lbl>Responsável</Lbl>
                <input name="owner" defaultValue={editing.owner} className={inputCls} />
              </div>
              <div>
                <Lbl>Prazo</Lbl>
                <input
                  name="deadline"
                  type="date"
                  defaultValue={editing.deadline ?? ""}
                  className={inputCls}
                />
              </div>
              <div>
                <Lbl>Fase</Lbl>
                <select name="stage" defaultValue={editing.stage} className={inputCls}>
                  {MARKETING_STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Lbl>Notas & anexos</Lbl>
              <textarea
                name="notes"
                rows={5}
                defaultValue={editing.notes ?? ""}
                className={cn(inputCls, "resize-none")}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Btn
                variant="ghost"
                onClick={async () => {
                  if (!confirm("Eliminar este projeto?")) return;
                  await fetch(`/api/marketing-tasks?id=${editing.id}`, { method: "DELETE" });
                  setEditing(null);
                  load();
                }}
              >
                <Trash2 className="size-4" /> Eliminar
              </Btn>
              <Btn variant="purple" type="submit" disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <User className="size-4" />}
                Guardar alterações
              </Btn>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
