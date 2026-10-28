"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Mail,
  Megaphone,
  Pause,
  PartyPopper,
  Play,
  Plus,
  Sparkles,
  Trash2,
  Video,
} from "lucide-react";
import {
  Badge,
  Btn,
  Card,
  Lbl,
  Modal,
  PageHeader,
  inputCls,
} from "../_components/ui";
import { CAMPAIGN_TYPES, labelOf } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Campaign = {
  id: number;
  name: string;
  type: string;
  channel: string;
  frequency: string;
  segment: string;
  status: string;
};

type ContactLite = { tags: { name: string }[]; type: string };

const TYPE_ICON: Record<string, React.ReactNode> = {
  newsletter: <Mail className="size-5" />,
  ads: <Megaphone className="size-5" />,
  evento: <Video className="size-5" />,
  comemoracao: <PartyPopper className="size-5" />,
  sequencia: <Sparkles className="size-5" />,
};

const SEGMENTS = [
  "todos",
  "lead-frio",
  "lead-quente",
  "cliente",
  "ex-cliente",
  "cliente-workshop",
  "cliente-mentoria",
];

const EMPTY = {
  name: "",
  type: "newsletter",
  channel: "email",
  frequency: "quinzenal",
  segment: "todos",
};

export default function RemarketingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contacts, setContacts] = useState<ContactLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [c, ct] = await Promise.all([
      fetch("/api/campaigns").then((r) => r.json()),
      fetch("/api/contacts").then((r) => r.json()),
    ]);
    setCampaigns(c);
    setContacts(ct);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const segmentCounts = useMemo(() => {
    const map: Record<string, number> = { todos: contacts.length };
    for (const s of SEGMENTS.slice(1)) {
      if (s === "ex-cliente" || s === "cliente") {
        map[s] =
          s === "cliente"
            ? contacts.filter((c) => c.type === "cliente").length
            : contacts.filter((c) => c.type === "ex-cliente").length;
      } else {
        map[s] = contacts.filter((c) => c.tags.some((t) => t.name === s)).length;
      }
    }
    return map;
  }, [contacts]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setModalOpen(false);
    setForm(EMPTY);
    load();
  }

  async function setStatus(id: number, status: string) {
    await fetch("/api/campaigns", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  async function remove(id: number) {
    if (!confirm("Eliminar esta campanha?")) return;
    await fetch(`/api/campaigns?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <PageHeader
        title="Re-marketing & Comunicações"
        subtitle="Campanhas de re-engajamento segmentadas a partir da base do CRM."
        actions={
          <Btn variant="purple" onClick={() => setModalOpen(true)}>
            <Plus className="size-4" /> Nova campanha
          </Btn>
        }
      />

      {/* Segmentos */}
      <Card className="mb-6 p-5">
        <h3 className="font-display text-lg font-semibold">
          Segmentos disponíveis na base
        </h3>
        <p className="mt-1 text-xs text-ink/50">
          Contagem em tempo real a partir das tags do CRM.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {SEGMENTS.map((s) => (
            <span
              key={s}
              className="rounded-full bg-ink px-3.5 py-2 text-xs font-bold text-white"
            >
              {s === "todos" ? "Toda a base" : `#${s}`}
              <span className="ml-2 text-white/50">{segmentCounts[s] ?? 0}</span>
            </span>
          ))}
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink/50">
          <Loader2 className="size-4 animate-spin" /> A carregar campanhas…
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((c) => (
            <Card
              key={c.id}
              className={cn(
                "flex flex-col p-5",
                c.status === "pausada" && "opacity-60"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-purple-soft text-purple">
                  {TYPE_ICON[c.type] ?? TYPE_ICON.newsletter}
                </span>
                <Badge
                  tone={
                    c.status === "ativa"
                      ? "green"
                      : c.status === "pausada"
                        ? "amber"
                        : c.status === "concluida"
                          ? "neutral"
                          : "outline"
                  }
                >
                  {c.status}
                </Badge>
              </div>
              <h3 className="font-display mt-4 text-lg leading-snug font-semibold">
                {c.name}
              </h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge tone="purple">{labelOf(CAMPAIGN_TYPES, c.type)}</Badge>
                <Badge tone="neutral">{c.channel}</Badge>
                <Badge tone="outline">{c.frequency}</Badge>
              </div>
              <p className="mt-3 text-xs text-ink/50">
                Segmento: <span className="font-mono font-bold text-purple">{c.segment === "todos" ? "toda a base" : `#${c.segment}`}</span>
                <span className="text-ink/35"> · {segmentCounts[c.segment] ?? 0} contactos</span>
              </p>
              <div className="mt-4 flex items-center gap-2 border-t border-ink/6 pt-4">
                {c.status !== "ativa" ? (
                  <button
                    onClick={() => setStatus(c.id, "ativa")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-200"
                  >
                    <Play className="size-3.5" /> Ativar
                  </button>
                ) : (
                  <button
                    onClick={() => setStatus(c.id, "pausada")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-2 text-xs font-bold text-amber-800 transition hover:bg-amber-200"
                  >
                    <Pause className="size-3.5" /> Pausar
                  </button>
                )}
                <button
                  onClick={() => remove(c.id)}
                  className="ml-auto text-ink/30 transition hover:text-red-600"
                  aria-label="Eliminar campanha"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Nota de identidade */}
      <Card tone="dark" className="mt-6 flex flex-wrap items-center gap-4 p-5">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-purple">
          <Mail className="size-5" />
        </span>
        <p className="flex-1 text-sm leading-relaxed text-white/70">
          Todos os templates de e-mail seguem a identidade visual do sistema —
          fundo branco, tipografia preta e detalhes em{" "}
          <span className="font-mono font-bold text-grape">#800080</span>.
          Sequências automáticas disparam por triggers (download do guia,
          compra, inatividade).
        </p>
      </Card>

      {/* Nova campanha */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova campanha">
        <form onSubmit={create} className="grid gap-4">
          <div>
            <Lbl>Nome</Lbl>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex.: Newsletter quinzenal de julho"
              className={inputCls}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Lbl>Tipo</Lbl>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className={inputCls}
              >
                {CAMPAIGN_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Lbl>Canal</Lbl>
              <select
                value={form.channel}
                onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
                className={inputCls}
              >
                <option value="email">E-mail</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="instagram">Instagram</option>
                <option value="meta-ads">Meta Ads</option>
                <option value="google-ads">Google Ads</option>
                <option value="email+whatsapp">E-mail + WhatsApp</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Lbl>Frequência</Lbl>
              <select
                value={form.frequency}
                onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
                className={inputCls}
              >
                <option value="semanal">Semanal</option>
                <option value="quinzenal">Quinzenal</option>
                <option value="continua">Contínua</option>
                <option value="por evento">Por evento</option>
                <option value="sazonal">Sazonal</option>
                <option value="trigger-based">Trigger-based</option>
              </select>
            </div>
            <div>
              <Lbl>Segmento</Lbl>
              <select
                value={form.segment}
                onChange={(e) => setForm((f) => ({ ...f, segment: e.target.value }))}
                className={inputCls}
              >
                {SEGMENTS.map((s) => (
                  <option key={s} value={s}>
                    {s === "todos" ? "Toda a base" : `#${s}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Btn variant="purple" type="submit" disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Criar campanha
          </Btn>
        </form>
      </Modal>
    </div>
  );
}
