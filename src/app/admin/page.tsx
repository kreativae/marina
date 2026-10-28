import { db } from "@/db";
import { bookings, contacts, deals, eventTypes } from "@/db/schema";
import { eq, gte } from "drizzle-orm";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Euro,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";
import { Card, PageHeader, StatCard, Badge } from "./_components/ui";
import {
  ActiveDonut,
  ConversionBars,
  OriginBar,
  RevenueBars,
} from "./_components/charts";
import {
  DEAL_STAGES,
  ORIGINS,
  PRODUCTS,
  labelOf,
} from "@/lib/constants";
import { daysSince, formatDate, formatEUR, toYMD } from "@/lib/utils";

export const dynamic = "force-dynamic";

const MONTHS_PT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const WON_STAGES = ["pagamento", "entregue", "pos-venda"];

export default async function DashboardPage() {
  const allContacts = await db.select().from(contacts);
  const allDeals = await db
    .select({ deal: deals, contact: contacts })
    .from(deals)
    .innerJoin(contacts, eq(deals.contactId, contacts.id));
  const upcoming = await db
    .select({ booking: bookings, eventType: eventTypes })
    .from(bookings)
    .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
    .where(gte(bookings.date, toYMD(new Date())));

  const leads = allContacts.filter((c) => c.type === "lead");
  const clientes = allContacts.filter((c) => c.type === "cliente");
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${now.getMonth()}`;

  const wonDeals = allDeals.filter((d) => WON_STAGES.includes(d.deal.stage));
  const revenueMonth = wonDeals
    .filter(
      (d) =>
        `${d.deal.updatedAt.getFullYear()}-${d.deal.updatedAt.getMonth()}` ===
        thisMonth
    )
    .reduce((s, d) => s + d.deal.value, 0);
  const revenueTotal = wonDeals.reduce((s, d) => s + d.deal.value, 0);

  // Receita últimos 6 meses (Mentoria vs Workshop)
  const revenueData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const inMonth = wonDeals.filter(
      (x) =>
        `${x.deal.updatedAt.getFullYear()}-${x.deal.updatedAt.getMonth()}` === key
    );
    return {
      month: MONTHS_PT[d.getMonth()],
      mentoria: inMonth
        .filter((x) => x.deal.product === "mentoria")
        .reduce((s, x) => s + x.deal.value, 0),
      workshop: inMonth
        .filter((x) => x.deal.product === "workshop")
        .reduce((s, x) => s + x.deal.value, 0),
    };
  });

  // Leads por origem
  const originData = ORIGINS.map((o) => ({
    name: o.label,
    total: allContacts.filter((c) => c.origin === o.id).length,
  })).filter((o) => o.total > 0);

  // Funil de conversão (deals por etapa)
  const funnelData = DEAL_STAGES.map((s) => ({
    name: s.label.replace(" / Checkout", "").replace(" Recebido", ""),
    value: allDeals.filter((d) => d.deal.stage === s.id).length,
  }));

  // Ativos vs inativos (interação há menos de 30 dias)
  const active = allContacts.filter((c) => daysSince(c.updatedAt) <= 30).length;
  const inactive = allContacts.length - active;

  // Taxa e tempo médio de conversão
  const conversionRate = allContacts.length
    ? Math.round((clientes.length / allContacts.length) * 100)
    : 0;
  const convTimes = clientes
    .map((c) => daysSince(c.createdAt) - daysSince(c.updatedAt))
    .filter((n) => n >= 0);
  const avgConversion =
    convTimes.length > 0
      ? Math.round(convTimes.reduce((a, b) => a + b, 0) / convTimes.length)
      : 0;

  const upcomingCount = upcoming.filter((b) => b.booking.status === "confirmado").length;
  const recentContacts = [...allContacts]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 6);
  const nextBookings = upcoming
    .filter((b) => b.booking.status === "confirmado")
    .slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral do ecossistema comercial — leads, receita e agenda."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Leads ativos"
          value={String(leads.length)}
          hint={`${allContacts.length} contactos no total`}
          icon={<Users className="size-5" />}
        />
        <StatCard
          label="Receita do mês"
          value={formatEUR(revenueMonth)}
          hint={`${formatEUR(revenueTotal)} acumulado`}
          icon={<Euro className="size-5" />}
          accent
        />
        <StatCard
          label="Taxa de conversão"
          value={`${conversionRate}%`}
          hint={`${clientes.length} clientes fechados`}
          icon={<TrendingUp className="size-5" />}
        />
        <StatCard
          label="Sessões agendadas"
          value={String(upcomingCount)}
          hint={`Tempo médio de conversão: ${avgConversion} dias`}
          icon={<CalendarDays className="size-5" />}
          accent
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Leads por origem</h3>
            <Badge tone="purple">A6 · Relatórios</Badge>
          </div>
          <OriginBar data={originData} />
        </Card>
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">
              Receita mensal — Mentoria vs Workshop
            </h3>
            <Badge tone="purple">Últimos 6 meses</Badge>
          </div>
          <RevenueBars data={revenueData} />
        </Card>
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Funil de conversão</h3>
            <Badge tone="purple">Pipeline A7</Badge>
          </div>
          <ConversionBars data={funnelData} />
        </Card>
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">
              Leads ativos vs inativos
            </h3>
            <Badge tone="purple">{active} ativos · {inactive} inativos</Badge>
          </div>
          <ActiveDonut
            data={[
              { name: "Ativos (<30 dias)", value: active },
              { name: "Inativos", value: inactive },
            ]}
          />
        </Card>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">
              Próximas sessões
            </h3>
            <Link
              href="/admin/agenda"
              className="inline-flex items-center gap-1 text-xs font-bold text-purple transition hover:text-ink"
            >
              Ver agenda <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <div className="space-y-2.5">
            {nextBookings.length === 0 && (
              <p className="py-6 text-center text-sm text-ink/45">
                Sem sessões futuras confirmadas.
              </p>
            )}
            {nextBookings.map(({ booking: b, eventType: ev }) => (
              <div
                key={b.id}
                className="flex items-center gap-4 rounded-xl border border-ink/6 bg-paper px-4 py-3"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-purple text-white">
                  <Video className="size-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{b.contactName}</p>
                  <p className="truncate text-xs text-ink/50">
                    {ev.name} · {ev.duration} min
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{formatDate(b.date)}</p>
                  <p className="text-xs text-purple">{b.startTime}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">
              Contactos recentes
            </h3>
            <Link
              href="/admin/crm"
              className="inline-flex items-center gap-1 text-xs font-bold text-purple transition hover:text-ink"
            >
              Abrir CRM <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <div className="space-y-2.5">
            {recentContacts.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-4 rounded-xl border border-ink/6 bg-paper px-4 py-3"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-white">
                  {c.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{c.name}</p>
                  <p className="truncate text-xs text-ink/50">
                    {labelOf(ORIGINS, c.origin)} ·{" "}
                    {labelOf(PRODUCTS, c.productInterest)}
                  </p>
                </div>
                <Badge tone={c.type === "cliente" ? "purple" : "neutral"}>
                  {c.type}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
