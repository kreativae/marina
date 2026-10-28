"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Euro,
  Loader2,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import KanbanBoard from "../_components/kanban";
import {
  Badge,
  Btn,
  Card,
  Lbl,
  Modal,
  PageHeader,
  StatCard,
  inputCls,
} from "../_components/ui";
import {
  DEAL_STAGES,
  PAYMENT_METHODS,
  PRODUCTS,
  labelOf,
} from "@/lib/constants";
import { cn, daysSince, formatDate, formatEUR } from "@/lib/utils";

type DealT = {
  id: number;
  contactId: number;
  title: string;
  product: string;
  value: number;
  paymentMethod: string;
  expectedCloseDate: string | null;
  stage: string;
  staleDays: number;
  createdAt: string;
  updatedAt: string;
};

type DealRow = { deal: DealT; contact: { id: number; name: string; email: string; phone: string | null } };

const DOTS = [
  "#e3d3e4",
  "#b266b2",
  "#800080",
  "#5c005c",
  "#0a0a0b",
  "#3a3a3c",
  "#a8a1aa",
];

const EMPTY = {
  contactName: "",
  title: "",
  product: "mentoria",
  value: "",
  paymentMethod: "mbway",
  expectedCloseDate: "",
};

export default function PipelinePage() {
  const [rows, setRows] = useState<DealRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DealRow | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/deals");
    setRows(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const items = useMemo(
    () =>
      rows.map((r) => ({
        id: r.deal.id,
        stage: r.deal.stage,
        row: r,
      })),
    [rows]
  );

  const openDeals = rows.filter(
    (r) => !["entregue", "pos-venda"].includes(r.deal.stage)
  );
  const openValue = openDeals.reduce((s, r) => s + r.deal.value, 0);
  const wonMonth = rows.filter(
    (r) =>
      ["pagamento", "entregue", "pos-venda"].includes(r.deal.stage) &&
      daysSince(r.deal.updatedAt) <= 30
  );
  const staleCount = openDeals.filter(
    (r) => daysSince(r.deal.updatedAt) >= r.deal.staleDays
  ).length;

  async function move(id: number, stage: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.deal.id === id ? { ...r, deal: { ...r.deal, stage } } : r
      )
    );
    await fetch("/api/deals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, stage }),
    });
    load();
  }

  async function createDeal(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactName: form.contactName,
        title: form.title || `${labelOf(PRODUCTS, form.product)} — ${form.contactName}`,
        product: form.product,
        value: Number(form.value) || 0,
        paymentMethod: form.paymentMethod,
        expectedCloseDate: form.expectedCloseDate || null,
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
    await fetch("/api/deals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editing.deal.id,
        title: f.get("title"),
        value: f.get("value"),
        paymentMethod: f.get("paymentMethod"),
        expectedCloseDate: f.get("expectedCloseDate") || null,
        stage: f.get("stage"),
      }),
    });
    setSaving(false);
    setEditing(null);
    load();
  }

  async function removeDeal(id: number) {
    if (!confirm("Eliminar este negócio do pipeline?")) return;
    await fetch(`/api/deals?id=${id}`, { method: "DELETE" });
    setEditing(null);
    load();
  }

  return (
    <div>
      <PageHeader
        title="Pipeline de Vendas"
        subtitle="De «Novo Lead» a «Pós-venda» — arrasta os cards entre etapas."
        actions={
          <Btn variant="purple" onClick={() => setModalOpen(true)}>
            <Plus className="size-4" /> Novo negócio
          </Btn>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Valor em aberto"
          value={formatEUR(openValue)}
          hint={`${openDeals.length} negócios ativos`}
          icon={<Euro className="size-5" />}
        />
        <StatCard
          label="Fechado (30 dias)"
          value={formatEUR(wonMonth.reduce((s, r) => s + r.deal.value, 0))}
          hint={`${wonMonth.length} pagamentos recebidos`}
          icon={<Wallet className="size-5" />}
          accent
        />
        <StatCard
          label="Total no pipeline"
          value={String(rows.length)}
          hint="Todas as etapas"
          icon={<CalendarDays className="size-5" />}
        />
        <StatCard
          label="Leads parados"
          value={String(staleCount)}
          hint="Sem atividade há +7 dias"
          icon={<AlertTriangle className="size-5" />}
          accent={staleCount > 0}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-ink/50">
          <Loader2 className="size-4 animate-spin" /> A carregar pipeline…
        </div>
      ) : (
        <KanbanBoard
          columns={DEAL_STAGES}
          items={items}
          onMove={move}
          accentDot={(_, i) => DOTS[i]}
          columnFooter={(its) => (
            <span className="font-bold">
              {formatEUR(its.reduce((s, it) => s + it.row.deal.value, 0))}
            </span>
          )}
          renderCard={({ row }) => {
            const stale =
              !["entregue", "pos-venda"].includes(row.deal.stage) &&
              daysSince(row.deal.updatedAt) >= row.deal.staleDays;
            return (
              <Card
                className={cn(
                  "p-4 transition hover:shadow-md hover:shadow-purple/10",
                  stale && "ring-1 ring-amber-300"
                )}
              >
                <button
                  onClick={() => setEditing(row)}
                  className="block w-full text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm leading-snug font-bold">
                      {row.contact.name}
                    </p>
                    {stale && (
                      <span
                        title={`Parado há ${daysSince(row.deal.updatedAt)} dias`}
                        className="grid size-6 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700"
                      >
                        <AlertTriangle className="size-3.5" />
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-ink/50">
                    {row.deal.title}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <Badge tone="purple">{labelOf(PRODUCTS, row.deal.product)}</Badge>
                    {row.deal.paymentMethod && (
                      <Badge tone="outline">
                        {labelOf(PAYMENT_METHODS, row.deal.paymentMethod)}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-ink/6 pt-2.5">
                    <span className="font-display text-base font-bold">
                      {formatEUR(row.deal.value)}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-ink/45">
                      <CalendarDays className="size-3" />
                      {formatDate(row.deal.expectedCloseDate)}
                    </span>
                  </div>
                  {stale && (
                    <p className="mt-2 text-[11px] font-bold text-amber-700">
                      Parado há {daysSince(row.deal.updatedAt)} dias — reativar?
                    </p>
                  )}
                </button>
              </Card>
            );
          }}
        />
      )}

      {/* Novo negócio */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo negócio">
        <form onSubmit={createDeal} className="grid gap-4">
          <div>
            <Lbl>Nome do lead / cliente</Lbl>
            <input
              required
              value={form.contactName}
              onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
              placeholder="Ex.: João Pereira"
              className={inputCls}
            />
          </div>
          <div>
            <Lbl>Descrição</Lbl>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ex.: Mentoria mensal"
              className={inputCls}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Lbl>Produto</Lbl>
              <select
                value={form.product}
                onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))}
                className={inputCls}
              >
                {PRODUCTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Lbl>Valor (€)</Lbl>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <Lbl>Método</Lbl>
              <select
                value={form.paymentMethod}
                onChange={(e) =>
                  setForm((f) => ({ ...f, paymentMethod: e.target.value }))
                }
                className={inputCls}
              >
                {PAYMENT_METHODS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Lbl>Data prevista de fecho</Lbl>
            <input
              type="date"
              value={form.expectedCloseDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, expectedCloseDate: e.target.value }))
              }
              className={inputCls}
            />
          </div>
          <Btn variant="purple" type="submit" disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Adicionar ao pipeline
          </Btn>
        </form>
      </Modal>

      {/* Editar negócio */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? editing.contact.name : ""}
      >
        {editing && (
          <form onSubmit={saveEdit} className="grid gap-4">
            <div>
              <Lbl>Descrição</Lbl>
              <input name="title" defaultValue={editing.deal.title} className={inputCls} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Lbl>Valor (€)</Lbl>
                <input
                  name="value"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={(editing.deal.value / 100).toString()}
                  className={inputCls}
                />
              </div>
              <div>
                <Lbl>Etapa</Lbl>
                <select name="stage" defaultValue={editing.deal.stage} className={inputCls}>
                  {DEAL_STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Lbl>Método de pagamento</Lbl>
                <select
                  name="paymentMethod"
                  defaultValue={editing.deal.paymentMethod}
                  className={inputCls}
                >
                  {PAYMENT_METHODS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Lbl>Fecho previsto</Lbl>
                <input
                  name="expectedCloseDate"
                  type="date"
                  defaultValue={editing.deal.expectedCloseDate ?? ""}
                  className={inputCls}
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Btn variant="ghost" onClick={() => removeDeal(editing.deal.id)}>
                <Trash2 className="size-4" /> Eliminar
              </Btn>
              <Btn variant="purple" type="submit" disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : "Guardar alterações"}
              </Btn>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
