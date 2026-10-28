"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
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
import {
  INTEGRATION_IDS,
  type IntegrationId,
  type IntegrationStatus,
} from "@/lib/integration-types";

const DETAILS: Record<
  IntegrationId,
  {
    name: string;
    description: string;
    icon: typeof Plug;
    setupUrl: string;
    setupLabel: string;
  }
> = {
  hotmart: {
    name: "Hotmart",
    description:
      "Recebe eventos oficiais de compra aprovada e reembolso, valida o HOTTOK e atualiza o CRM.",
    icon: ShoppingCart,
    setupUrl: "https://app.hotmart.com/tools/webhook",
    setupLabel: "Configurar webhook",
  },
  "google-calendar": {
    name: "Google Calendar",
    description:
      "Consulta e sincroniza eventos com o calendário escolhido através da API oficial do Google.",
    icon: CalendarDays,
    setupUrl: "https://console.cloud.google.com/apis/library/calendar-json.googleapis.com",
    setupLabel: "Ativar Google Calendar API",
  },
  zoom: {
    name: "Zoom",
    description:
      "Autentica a conta Zoom Server-to-Server OAuth. Reuniões só serão criadas quando o serviço estiver ligado.",
    icon: Video,
    setupUrl: "https://marketplace.zoom.us/",
    setupLabel: "Criar aplicação Zoom",
  },
  whatsapp: {
    name: "WhatsApp Business Cloud API",
    description:
      "Verifica o número empresarial e a autorização na API oficial da Meta. Mensagens exigem consentimento e regras de template.",
    icon: MessageCircle,
    setupUrl: "https://developers.facebook.com/apps/",
    setupLabel: "Configurar aplicação Meta",
  },
  moloni: {
    name: "Moloni",
    description:
      "Valida a autorização OAuth com Moloni. A emissão fiscal requer configuração de série, produtos e dados fiscais.",
    icon: Receipt,
    setupUrl: "https://www.moloni.pt/dev/",
    setupLabel: "Ativar API Moloni",
  },
  resend: {
    name: "E-mail transacional · Resend",
    description:
      "Confirma a chave da API e se o domínio do remetente está verificado para envio.",
    icon: Mail,
    setupUrl: "https://resend.com/domains",
    setupLabel: "Verificar domínio de envio",
  },
  meta: {
    name: "Meta Conversions API",
    description:
      "Valida acesso ao Pixel. Eventos de conversão só devem ser enviados com base legal e consentimento aplicável.",
    icon: Megaphone,
    setupUrl: "https://business.facebook.com/events_manager2/",
    setupLabel: "Abrir Gestor de Eventos",
  },
};

type TestResult = { ok: boolean; message: string };

export default function IntegracoesPage() {
  const [statuses, setStatuses] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusError, setStatusError] = useState("");
  const [testing, setTesting] = useState<IntegrationId | null>(null);
  const [results, setResults] = useState<
    Partial<Record<IntegrationId, TestResult>>
  >({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/integrations", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Não foi possível carregar as integrações.");
        }
        return (await response.json()) as {
          integrations: IntegrationStatus[];
        };
      })
      .then((data) => {
        if (active) setStatuses(data.integrations);
      })
      .catch(() => {
        if (active) setStatusError("Não foi possível carregar o estado das integrações.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function testConnection(id: IntegrationId) {
    setTesting(id);
    setResults((current) => ({ ...current, [id]: undefined }));
    try {
      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };
      setResults((current) => ({
        ...current,
        [id]: {
          ok: response.ok && data.ok === true,
          message: data.message ?? data.error ?? "Falha ao testar o serviço.",
        },
      }));
    } catch {
      setResults((current) => ({
        ...current,
        [id]: { ok: false, message: "Falha de rede ao testar o serviço." },
      }));
    } finally {
      setTesting(null);
    }
  }

  async function copyWebhook() {
    await navigator.clipboard.writeText(
      `${window.location.origin}/api/webhooks/hotmart`
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const statusById = new Map(statuses.map((item) => [item.id, item]));

  return (
    <div>
      <PageHeader
        title="Integrações"
        subtitle="Estado real dos serviços, autenticação e próximos passos de configuração."
      />

      <Card tone="dark" className="mb-6 p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-purple">
                <ShoppingCart className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-semibold">
                  Webhook Hotmart → CRM
                </h2>
                <p className="text-xs text-white/60">
                  Endpoint de produção; não é um simulador.
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              Configure este endereço no painel Hotmart e defina o mesmo segredo
              em <code className="text-grape">HOTMART_WEBHOOK_SECRET</code> na
              Vercel. O servidor valida o cabeçalho{" "}
              <code className="text-grape">X-HOTMART-HOTTOK</code> antes de
              processar eventos reais.
            </p>
            <code className="mt-4 block break-all rounded-xl bg-white/10 px-4 py-3 font-mono text-xs text-white/80">
              /api/webhooks/hotmart
            </code>
          </div>
          <Btn variant="purple" onClick={copyWebhook}>
            {copied ? <CheckCircle2 className="size-4" /> : <CreditCard className="size-4" />}
            {copied ? "Copiado" : "Copiar endpoint"}
          </Btn>
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink/50">
          <Loader2 className="size-4 animate-spin" /> A verificar configuração…
        </div>
      ) : (
        <>
        {statusError && (
          <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {statusError}
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {INTEGRATION_IDS.map((id) => {
            const details = DETAILS[id];
            const Icon = details.icon;
            const status = statusById.get(id);
            const result = results[id];
            const busy = testing === id;
            return (
              <Card key={id} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-purple-soft text-purple">
                    <Icon className="size-5" />
                  </span>
                  {result?.ok && id === "hotmart" ? (
                    <Badge tone="amber">À espera de webhook</Badge>
                  ) : result?.ok ? (
                    <Badge tone="green">Conectado</Badge>
                  ) : status?.configured ? (
                    <Badge tone="amber">Não validado</Badge>
                  ) : (
                    <Badge tone="outline">Configuração pendente</Badge>
                  )}
                </div>
                <h3 className="font-display mt-4 text-lg font-semibold">
                  {details.name}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/55">
                  {details.description}
                </p>
                {!status?.configured && (
                  <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
                    <p className="flex items-center gap-1.5 font-bold">
                      <CircleAlert className="size-3.5" />
                      Variáveis ausentes
                    </p>
                    <p className="mt-1 break-words font-mono">
                      {status?.requiredVariables.join(", ") ?? "Carregando…"}
                    </p>
                  </div>
                )}
                {result && (
                  <p
                    role="status"
                    className={`mt-3 rounded-xl p-3 text-xs leading-relaxed ${
                      result.ok
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-red-50 text-red-800"
                    }`}
                  >
                    {result.message}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink/6 pt-4">
                  <a
                    href={details.setupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-purple"
                  >
                    {details.setupLabel}
                    <ExternalLink className="size-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => testConnection(id)}
                    disabled={busy || !status?.configured}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-ink/12 px-3 py-2 text-xs font-bold text-ink transition hover:border-purple hover:text-purple disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {busy ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Plug className="size-3.5" />
                    )}
                    Testar ligação
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
        </>
      )}

      <Card className="mt-6 p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-purple-soft text-purple">
            <ArrowUpRight className="size-4" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold">
              Configuração segura
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink/55">
              Adicione as chaves nas variáveis de ambiente da Vercel e faça um
              novo deploy. Os valores secretos não são enviados ao navegador nem
              apresentados neste painel. Este teste valida autenticação; não
              envia mensagens, cria faturas ou publica eventos de conversão.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
