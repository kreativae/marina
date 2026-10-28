"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  Loader2,
  Mail,
  Megaphone,
  MessageCircle,
  Plug,
  Receipt,
  ShoppingCart,
  Video,
} from "lucide-react";
import { Badge, Btn, Card, PageHeader } from "../_components/ui";
import { HOTMART_CHECKOUT_URL, WHATSAPP_NUMBER } from "@/lib/constants";
import { cn } from "@/lib/utils";

type TestResult = { ok: boolean; contactId?: number; dealId?: number; event?: string; error?: string } | null;

export default function IntegracoesPage() {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [result, setResult] = useState<TestResult>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const webhookUrl = `${origin}/api/webhooks/hotmart`;

  async function simulate(event: "purchase" | "refund") {
    setTesting(event);
    setResult(null);
    const n = Math.floor(Math.random() * 900 + 100);
    try {
      const res = await fetch("/api/webhooks/hotmart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          event === "purchase"
            ? {
                event: "purchase",
                name: `Aluna Hotmart ${n}`,
                email: `aluna.hotmart${n}@gmail.com`,
                product: "workshop",
                value: 47,
                geography: "internacional",
              }
            : {
                event: "refund",
                name: "Comprador reembolsado",
                email: `aluna.hotmart${n}@gmail.com`,
                product: "workshop",
                value: 47,
              }
        ),
      });
      setResult(await res.json());
    } catch {
      setResult({ ok: false, error: "Falha de rede" });
    }
    setTesting(null);
  }

  const INTEGRATIONS = [
    {
      icon: MessageCircle,
      name: "WhatsApp Business API",
      desc: "Canal principal de entrada de contactos. Registo automático no CRM com tags por origem e interesse.",
      status: "Ativo",
      tone: "green" as const,
      action: (
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-purple"
        >
          Abrir WhatsApp <ExternalLink className="size-3.5" />
        </a>
      ),
    },
    {
      icon: CalendarDays,
      name: "Google Calendar",
      desc: "Sincronização bidirecional: agendamentos criam eventos; bloqueios do Google tornam-se indisponibilidades.",
      status: "Sincronizado",
      tone: "green" as const,
      action: (
        <Link href="/admin/agenda" className="inline-flex items-center gap-1.5 text-xs font-bold text-purple">
          Gerir bloqueios <ArrowRight className="size-3.5" />
        </Link>
      ),
    },
    {
      icon: Video,
      name: "Zoom",
      desc: "Agendamento → sala criada automaticamente → link enviado por e-mail. Reforço por WhatsApp disponível na agenda.",
      status: "Configurado",
      tone: "green" as const,
      action: (
        <Link href="/admin/agenda" className="inline-flex items-center gap-1.5 text-xs font-bold text-purple">
          Validar fluxo <ArrowRight className="size-3.5" />
        </Link>
      ),
    },
    {
      icon: Receipt,
      name: "Moloni — Faturação PT",
      desc: "Emissão manual de faturas para pagamentos por MBWay e transferência. Estado de pagamento atualizado no CRM.",
      status: "Manual (por definição)",
      tone: "amber" as const,
      action: (
        <a href="https://www.moloni.pt" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-purple">
          Abrir Moloni <ExternalLink className="size-3.5" />
        </a>
      ),
    },
    {
      icon: Mail,
      name: "E-mail Marketing",
      desc: "Newsletters, sequências automáticas e envio de materiais pós-sessão. Templates com a identidade do sistema.",
      status: "Ativo",
      tone: "green" as const,
      action: (
        <Link href="/admin/remarketing" className="inline-flex items-center gap-1.5 text-xs font-bold text-purple">
          Ver campanhas <ArrowRight className="size-3.5" />
        </Link>
      ),
    },
    {
      icon: Megaphone,
      name: "Meta Ads",
      desc: "Pixel + API de Conversões para remarketing de visitantes do site. Planeado para a próxima fase.",
      status: "Futuro",
      tone: "outline" as const,
      action: <span className="text-xs font-bold text-ink/35">Fase 2</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Integrações"
        subtitle="Mapa de integrações do ecossistema — com testes em ambiente real."
      />

      {/* HOTMART — destaque */}
      <Card className="grain relative mb-6 overflow-hidden bg-ink p-6 text-white sm:p-8">
        <span className="absolute -top-20 -right-20 size-64 rounded-full bg-purple/40 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-purple">
                <ShoppingCart className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-semibold">Hotmart ↔ CRM</h2>
                <p className="text-xs text-white/50">Webhooks de compra e reembolso</p>
              </div>
              <Badge tone="green">Ativo</Badge>
            </div>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/65">
              Cada compra na Hotmart cria/atualiza o contacto no CRM com{" "}
              <span className="font-mono text-grape">#cliente-workshop</span>, move para
              «Pagamento Recebido» no pipeline e regista a receita. Reembolsos
              atualizam o estado de pagamento automaticamente.
            </p>
            <div className="mt-5">
              <p className="text-[11px] font-bold tracking-wider text-white/40 uppercase">
                URL do webhook (configurar no painel Hotmart)
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 truncate rounded-xl bg-white/10 px-4 py-3 font-mono text-xs text-grape ring-1 ring-white/15">
                  {webhookUrl || "…"}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(webhookUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="grid size-11 shrink-0 place-items-center rounded-xl bg-purple text-white transition hover:bg-grape"
                  aria-label="Copiar URL"
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white/6 p-5 ring-1 ring-white/10">
            <p className="text-[11px] font-bold tracking-wider text-white/40 uppercase">
              Simulador em tempo real
            </p>
            <p className="mt-2 text-xs leading-relaxed text-white/55">
              Testa o fluxo completo — os dados entram mesmo no CRM e no pipeline.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => simulate("purchase")}
                disabled={!!testing}
                className="inline-flex items-center gap-2 rounded-xl bg-purple px-4 py-2.5 text-xs font-bold text-white transition hover:bg-grape disabled:opacity-50"
              >
                {testing === "purchase" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <CreditCard className="size-3.5" />
                )}
                Simular compra
              </button>
              <button
                onClick={() => simulate("refund")}
                disabled={!!testing}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-xs font-bold text-white/80 transition hover:bg-white/10 disabled:opacity-50"
              >
                {testing === "refund" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Receipt className="size-3.5" />
                )}
                Simular reembolso
              </button>
            </div>
            {result && (
              <div
                className={cn(
                  "mt-4 rounded-xl px-4 py-3 text-xs leading-relaxed",
                  result.ok
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-red-500/15 text-red-300"
                )}
              >
                {result.ok ? (
                  <>
                    <CheckCircle2 className="mr-1.5 inline size-3.5" />
                    {result.event === "purchase"
                      ? `Compra processada — contacto #${result.contactId} criado/atualizado com tags + deal #${result.dealId} em «Pagamento Recebido».`
                      : `Reembolso registado — contacto #${result.contactId} com pagamento «Reembolsado».`}
                    <Link href="/admin/crm" className="ml-2 font-bold underline">
                      Ver no CRM
                    </Link>
                  </>
                ) : (
                  <>Erro: {result.error}</>
                )}
              </div>
            )}
            <p className="mt-3 font-mono text-[10px] text-white/30">
              Checkout: {HOTMART_CHECKOUT_URL}
            </p>
          </div>
        </div>
      </Card>

      {/* Grelha de integrações */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {INTEGRATIONS.map((i) => (
          <Card key={i.name} className="flex flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-purple-soft text-purple">
                <i.icon className="size-5" />
              </span>
              <Badge tone={i.tone}>{i.status}</Badge>
            </div>
            <h3 className="font-display mt-4 text-lg font-semibold">{i.name}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/55">{i.desc}</p>
            <div className="mt-4 border-t border-ink/6 pt-4">{i.action}</div>
          </Card>
        ))}
      </div>

      {/* Documentação de fluxos */}
      <div className="mt-8">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-ink text-white">
            <Plug className="size-4" />
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold">Fluxos principais</h2>
            <p className="text-xs text-ink/50">Documentação de uso — versão 2.0</p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            {
              title: "Fluxo 1 — Mentoria (Portugal)",
              steps: [
                "Site → CTA WhatsApp",
                "Tag #mentoria automática",
                "CRM: novo lead",
                "Agendamento (Zoom + Google)",
                "Pagamento MBWay/Transferência",
                "Fatura manual no Moloni",
                "Sessão Zoom + materiais por e-mail",
              ],
            },
            {
              title: "Fluxo 2 — Workshop (Internacional)",
              steps: [
                "Site → CTA Hotmart",
                "Checkout Hotmart",
                "Webhook → CRM (cliente)",
                "Agendamento + Zoom",
                "Link por e-mail + WhatsApp",
                "Materiais por e-mail",
              ],
            },
            {
              title: "Fluxo 3 — Marketing",
              steps: [
                "Pesquisa de mercado",
                "Pipeline de processos",
                "Calendário editorial",
                "Esteira de conteúdo Instagram",
                "Publicação",
                "Re-marketing + análise",
              ],
            },
          ].map((f) => (
            <Card key={f.title} className="p-5">
              <h3 className="font-display text-base font-semibold">{f.title}</h3>
              <ol className="mt-4 space-y-2.5">
                {f.steps.map((s, i) => (
                  <li key={s} className="flex items-start gap-3 text-sm text-ink/65">
                    <span className="grid size-5.5 shrink-0 place-items-center rounded-full bg-purple-soft text-[10px] font-bold text-purple">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
