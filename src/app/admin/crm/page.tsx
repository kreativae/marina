"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Tag,
  Trash2,
  UserPlus,
  Users,
  X,
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
import {
  CONTACT_STATUSES,
  CONTACT_TYPES,
  GEOGRAPHIES,
  ORIGINS,
  PAYMENT_STATUSES,
  PRODUCTS,
  SYSTEM_TAGS,
  labelOf,
} from "@/lib/constants";
import {
  cn,
  daysSince,
  formatDate,
  initials,
  whatsappLink,
} from "@/lib/utils";

type ContactT = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  origin: string;
  productInterest: string;
  type: string;
  status: string;
  geography: string;
  paymentStatus: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  tags: { id: number; name: string }[];
};

type InteractionT = {
  id: number;
  channel: string;
  content: string;
  createdAt: string;
};

const CHANNEL_ICON: Record<string, React.ReactNode> = {
  whatsapp: <MessageCircle className="size-3.5" />,
  email: <Mail className="size-3.5" />,
  chamada: <Phone className="size-3.5" />,
  sistema: <Check className="size-3.5" />,
};

const paymentTone = (s: string) =>
  s === "pago" ? "green" : s === "pendente" ? "amber" : "red";

const statusTone = (s: string) =>
  s === "fechado" ? "green" : s === "perdido" ? "red" : s === "proposta" ? "purple" : "neutral";

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  origin: "site",
  productInterest: "mentoria",
  type: "lead",
  status: "novo",
  geography: "portugal",
};

export default function CrmPage() {
  const [contacts, setContacts] = useState<ContactT[]>([]);
  const [allTags, setAllTags] = useState<string[]>(SYSTEM_TAGS);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    origin: "",
    product: "",
    type: "",
    status: "",
    geography: "",
    payment: "",
    tag: "",
  });
  const [selected, setSelected] = useState<ContactT | null>(null);
  const [interactions, setInteractions] = useState<InteractionT[]>([]);
  const [newInteraction, setNewInteraction] = useState("");
  const [newChannel, setNewChannel] = useState("whatsapp");
  const [newTag, setNewTag] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/contacts");
    const data: ContactT[] = await res.json();
    setContacts(data);
    const tagSet = new Set(SYSTEM_TAGS);
    data.forEach((c) => c.tags.forEach((t) => tagSet.add(t.name)));
    setAllTags([...tagSet]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!selected) return;
    fetch(`/api/interactions?contactId=${selected.id}`)
      .then((r) => r.json())
      .then(setInteractions);
  }, [selected]);

  const filtered = useMemo(() => {
    const s = filters.search.toLowerCase();
    return contacts.filter((c) => {
      if (s && !`${c.name} ${c.email} ${c.phone ?? ""}`.toLowerCase().includes(s))
        return false;
      if (filters.origin && c.origin !== filters.origin) return false;
      if (filters.product && c.productInterest !== filters.product) return false;
      if (filters.type && c.type !== filters.type) return false;
      if (filters.status && c.status !== filters.status) return false;
      if (filters.geography && c.geography !== filters.geography) return false;
      if (filters.payment && c.paymentStatus !== filters.payment) return false;
      if (filters.tag && !c.tags.some((t) => t.name === filters.tag)) return false;
      return true;
    });
  }, [contacts, filters]);

  const counts = useMemo(
    () => ({
      lead: contacts.filter((c) => c.type === "lead").length,
      cliente: contacts.filter((c) => c.type === "cliente").length,
      "ex-cliente": contacts.filter((c) => c.type === "ex-cliente").length,
    }),
    [contacts]
  );

  async function patchContact(id: number, patch: Record<string, unknown>) {
    const res = await fetch("/api/contacts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    if (res.ok) {
      await load();
      if (selected?.id === id) {
        const updated = await fetch("/api/contacts").then((r) => r.json());
        const found = updated.find((c: ContactT) => c.id === id);
        if (found) setSelected(found);
      }
    }
  }

  async function addInteraction() {
    if (!selected || !newInteraction.trim()) return;
    const res = await fetch("/api/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId: selected.id,
        channel: newChannel,
        content: newInteraction,
      }),
    });
    if (res.ok) {
      setNewInteraction("");
      const data = await fetch(
        `/api/interactions?contactId=${selected.id}`
      ).then((r) => r.json());
      setInteractions(data);
    }
  }

  async function createContact(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setModalOpen(false);
      setForm(EMPTY_FORM);
      load();
    }
  }

  async function removeContact(id: number) {
    if (!confirm("Eliminar este contacto e todo o histórico?")) return;
    await fetch(`/api/contacts?id=${id}`, { method: "DELETE" });
    setSelected(null);
    load();
  }

  return (
    <div>
      <PageHeader
        title="Contactos & CRM"
        subtitle="Base única de leads e clientes — com tags, origens e histórico completo."
        actions={
          <Btn variant="purple" onClick={() => setModalOpen(true)}>
            <UserPlus className="size-4" /> Novo contacto
          </Btn>
        }
      />

      {/* Segmentação rápida (A8) */}
      <div className="mb-5 flex flex-wrap gap-2.5">
        {CONTACT_TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() =>
              setFilters((f) => ({ ...f, type: f.type === t.id ? "" : t.id }))
            }
            className={cn(
              "rounded-full border px-4 py-2 text-xs font-bold transition",
              filters.type === t.id
                ? "border-purple bg-purple text-white"
                : "border-ink/12 bg-white text-ink/65 hover:border-purple/50"
            )}
          >
            {t.label}
            <span className="ml-1.5 opacity-60">
              {counts[t.id as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <Card className="mb-5 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <div className="relative xl:col-span-2">
            <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink/35" />
            <input
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
              placeholder="Pesquisar nome, e-mail, telefone…"
              className={cn(inputCls, "pl-10")}
            />
          </div>
          {(
            [
              ["origin", "Origem", ORIGINS],
              ["product", "Produto", PRODUCTS],
              ["status", "Status", CONTACT_STATUSES],
              ["geography", "Geografia", GEOGRAPHIES],
              ["payment", "Pagamento", PAYMENT_STATUSES],
            ] as const
          ).map(([key, placeholder, list]) => (
            <select
              key={key}
              value={filters[key]}
              onChange={(e) =>
                setFilters((f) => ({ ...f, [key]: e.target.value }))
              }
              className={inputCls}
            >
              <option value="">{placeholder}: todas</option>
              {list.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          ))}
        </div>
        {Object.values(filters).some(Boolean) && (
          <button
            onClick={() =>
              setFilters({
                search: "",
                origin: "",
                product: "",
                type: "",
                status: "",
                geography: "",
                payment: "",
                tag: "",
              })
            }
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-purple"
          >
            <X className="size-3.5" /> Limpar filtros
          </button>
        )}
      </Card>

      {/* Tabela */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink/50">
            <Loader2 className="size-4 animate-spin" /> A carregar contactos…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Users className="size-6" />}
              title="Sem contactos"
              text="Ajusta os filtros ou adiciona o primeiro contacto."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b border-ink/8 text-left text-[11px] font-bold tracking-wider text-ink/45 uppercase">
                  <th className="px-5 py-3.5">Nome</th>
                  <th className="px-4 py-3.5">Origem</th>
                  <th className="px-4 py-3.5">Produto</th>
                  <th className="px-4 py-3.5">Tags</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Pagamento</th>
                  <th className="px-5 py-3.5 text-right">Atualizado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className="cursor-pointer border-b border-ink/5 transition last:border-0 hover:bg-purple-soft/50"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white",
                            c.type === "cliente" ? "bg-purple" : "bg-ink"
                          )}
                        >
                          {initials(c.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-bold">{c.name}</p>
                          <p className="truncate text-xs text-ink/50">
                            {c.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge tone="outline">{labelOf(ORIGINS, c.origin)}</Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge tone="neutral">
                        {labelOf(PRODUCTS, c.productInterest)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex max-w-44 flex-wrap gap-1">
                        {c.tags.slice(0, 3).map((t) => (
                          <span
                            key={t.id}
                            className="rounded-full bg-purple-soft px-2 py-0.5 font-mono text-[10px] font-semibold text-purple"
                          >
                            #{t.name}
                          </span>
                        ))}
                        {c.tags.length > 3 && (
                          <span className="text-[10px] text-ink/40">
                            +{c.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge tone={statusTone(c.status)}>
                        {labelOf(CONTACT_STATUSES, c.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge tone={paymentTone(c.paymentStatus)}>
                        {labelOf(PAYMENT_STATUSES, c.paymentStatus)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs text-ink/50">
                      há {daysSince(c.updatedAt)} dias
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Gaveta de detalhe */}
      {selected && (
        <div className="fixed inset-0 z-[60]">
          <div
            className="animate-fade-in absolute inset-0 bg-ink/50 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />
          <aside className="animate-fade-in absolute inset-y-0 right-0 w-full overflow-y-auto bg-white shadow-2xl sm:max-w-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink/8 bg-white/90 px-6 py-4 backdrop-blur">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-purple text-sm font-bold text-white">
                  {initials(selected.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-semibold">
                    {selected.name}
                  </p>
                  <p className="truncate text-xs text-ink/50">
                    {labelOf(ORIGINS, selected.origin)} ·{" "}
                    {labelOf(GEOGRAPHIES, selected.geography)} · desde{" "}
                    {formatDate(selected.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {selected.phone && (
                  <a
                    href={whatsappLink(
                      selected.phone,
                      `Olá ${selected.name.split(" ")[0]}! Aqui é a Marina Loyola.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="grid size-9 place-items-center rounded-full bg-ink text-white transition hover:bg-purple"
                    aria-label="Abrir WhatsApp"
                  >
                    <MessageCircle className="size-4" />
                  </a>
                )}
                <a
                  href={`mailto:${selected.email}`}
                  className="grid size-9 place-items-center rounded-full bg-ink text-white transition hover:bg-purple"
                  aria-label="Enviar e-mail"
                >
                  <Mail className="size-4" />
                </a>
                <button
                  onClick={() => removeContact(selected.id)}
                  className="grid size-9 place-items-center rounded-full border border-red-200 text-red-600 transition hover:bg-red-50"
                  aria-label="Eliminar contacto"
                >
                  <Trash2 className="size-4" />
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="grid size-9 place-items-center rounded-full border border-ink/10 text-ink/60 transition hover:border-purple hover:text-purple"
                  aria-label="Fechar"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="space-y-7 p-6">
              {/* Campos CRM (A6) */}
              <section>
                <h3 className="mb-3 text-xs font-bold tracking-wider text-ink/45 uppercase">
                  Dados do contacto
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Lbl>Nome</Lbl>
                    <input
                      defaultValue={selected.name}
                      onBlur={(e) =>
                        e.target.value !== selected.name &&
                        patchContact(selected.id, { name: e.target.value })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <Lbl>E-mail</Lbl>
                    <input
                      defaultValue={selected.email}
                      onBlur={(e) =>
                        e.target.value !== selected.email &&
                        patchContact(selected.id, { email: e.target.value })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <Lbl>Telefone / WhatsApp</Lbl>
                    <input
                      defaultValue={selected.phone ?? ""}
                      placeholder="+351 …"
                      onBlur={(e) =>
                        e.target.value !== (selected.phone ?? "") &&
                        patchContact(selected.id, { phone: e.target.value })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <Lbl>Origem</Lbl>
                    <select
                      value={selected.origin}
                      onChange={(e) =>
                        patchContact(selected.id, { origin: e.target.value })
                      }
                      className={inputCls}
                    >
                      {ORIGINS.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Lbl>Produto de interesse</Lbl>
                    <select
                      value={selected.productInterest}
                      onChange={(e) =>
                        patchContact(selected.id, {
                          productInterest: e.target.value,
                        })
                      }
                      className={inputCls}
                    >
                      {PRODUCTS.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Lbl>Status</Lbl>
                    <select
                      value={selected.status}
                      onChange={(e) =>
                        patchContact(selected.id, { status: e.target.value })
                      }
                      className={inputCls}
                    >
                      {CONTACT_STATUSES.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Lbl>Tipo</Lbl>
                    <select
                      value={selected.type}
                      onChange={(e) =>
                        patchContact(selected.id, { type: e.target.value })
                      }
                      className={inputCls}
                    >
                      {CONTACT_TYPES.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Lbl>Geografia</Lbl>
                    <select
                      value={selected.geography}
                      onChange={(e) =>
                        patchContact(selected.id, { geography: e.target.value })
                      }
                      className={inputCls}
                    >
                      {GEOGRAPHIES.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Lbl>Pagamento</Lbl>
                    <select
                      value={selected.paymentStatus}
                      onChange={(e) =>
                        patchContact(selected.id, {
                          paymentStatus: e.target.value,
                        })
                      }
                      className={inputCls}
                    >
                      {PAYMENT_STATUSES.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              {/* Tags (A1) */}
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-ink/45 uppercase">
                  <Tag className="size-3.5" /> Tags automáticas e manuais
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selected.tags.map((t) => (
                    <span
                      key={t.id}
                      className="group inline-flex items-center gap-1.5 rounded-full bg-purple-soft px-3 py-1.5 font-mono text-xs font-semibold text-purple"
                    >
                      #{t.name}
                      <button
                        onClick={() =>
                          patchContact(selected.id, {
                            tags: selected.tags
                              .filter((x) => x.id !== t.id)
                              .map((x) => x.name),
                          })
                        }
                        className="opacity-40 transition hover:opacity-100"
                        aria-label={`Remover tag ${t.name}`}
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                  {selected.tags.length === 0 && (
                    <span className="text-xs text-ink/40">Sem tags ainda.</span>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newTag.trim()) {
                        patchContact(selected.id, {
                          tags: [
                            ...selected.tags.map((t) => t.name),
                            newTag.trim(),
                          ],
                        });
                        setNewTag("");
                      }
                    }}
                    list="tag-suggestions"
                    placeholder="Nova tag…"
                    className={cn(inputCls, "flex-1")}
                  />
                  <datalist id="tag-suggestions">
                    {allTags.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                  <Btn
                    variant="ghost"
                    onClick={() => {
                      if (!newTag.trim()) return;
                      patchContact(selected.id, {
                        tags: [...selected.tags.map((t) => t.name), newTag.trim()],
                      });
                      setNewTag("");
                    }}
                  >
                    <Plus className="size-4" />
                  </Btn>
                </div>
              </section>

              {/* Histórico (A6) */}
              <section>
                <h3 className="mb-3 text-xs font-bold tracking-wider text-ink/45 uppercase">
                  Histórico de interações
                </h3>
                <div className="flex gap-2">
                  <select
                    value={newChannel}
                    onChange={(e) => setNewChannel(e.target.value)}
                    className={cn(inputCls, "w-36")}
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">E-mail</option>
                    <option value="chamada">Chamada</option>
                  </select>
                  <input
                    value={newInteraction}
                    onChange={(e) => setNewInteraction(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addInteraction()}
                    placeholder="Registar interação…"
                    className={cn(inputCls, "flex-1")}
                  />
                  <Btn variant="primary" onClick={addInteraction}>
                    <Plus className="size-4" />
                  </Btn>
                </div>
                <div className="mt-4 space-y-2.5">
                  {interactions.map((it) => (
                    <div
                      key={it.id}
                      className="flex gap-3 rounded-xl border border-ink/6 bg-paper p-3.5"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-purple-soft text-purple">
                        {CHANNEL_ICON[it.channel] ?? CHANNEL_ICON.sistema}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-ink/50 uppercase">
                          {it.channel} · {formatDate(it.createdAt)}
                        </p>
                        <p className="mt-0.5 text-sm leading-relaxed text-ink/75">
                          {it.content}
                        </p>
                      </div>
                    </div>
                  ))}
                  {interactions.length === 0 && (
                    <p className="py-4 text-center text-xs text-ink/40">
                      Ainda sem interações registadas.
                    </p>
                  )}
                </div>
              </section>
            </div>
          </aside>
        </div>
      )}

      {/* Modal novo contacto */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Novo contacto"
      >
        <form onSubmit={createContact} className="grid gap-4">
          <div>
            <Lbl>Nome completo</Lbl>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Lbl>E-mail</Lbl>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <Lbl>Telefone / WhatsApp</Lbl>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+351 …"
                className={inputCls}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Lbl>Origem</Lbl>
              <select
                value={form.origin}
                onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))}
                className={inputCls}
              >
                {ORIGINS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Lbl>Produto</Lbl>
              <select
                value={form.productInterest}
                onChange={(e) =>
                  setForm((f) => ({ ...f, productInterest: e.target.value }))
                }
                className={inputCls}
              >
                {PRODUCTS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Lbl>Geografia</Lbl>
              <select
                value={form.geography}
                onChange={(e) =>
                  setForm((f) => ({ ...f, geography: e.target.value }))
                }
                className={inputCls}
              >
                {GEOGRAPHIES.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Btn variant="purple" type="submit" disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Criar contacto
          </Btn>
        </form>
      </Modal>
    </div>
  );
}
