import {
  INTEGRATION_IDS,
  type IntegrationId,
  type IntegrationStatus,
} from "./integration-types";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { integrationCredentials } from "@/db/schema";

export { INTEGRATION_IDS };
export type { IntegrationId, IntegrationStatus };

const REQUIRED_VARIABLES: Record<IntegrationId, string[]> = {
  hotmart: ["HOTMART_WEBHOOK_SECRET"],
  "google-calendar": [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REFRESH_TOKEN",
    "GOOGLE_CALENDAR_ID",
  ],
  zoom: ["ZOOM_ACCOUNT_ID", "ZOOM_CLIENT_ID", "ZOOM_CLIENT_SECRET"],
  whatsapp: [
    "WHATSAPP_ACCESS_TOKEN",
    "WHATSAPP_PHONE_NUMBER_ID",
    "WHATSAPP_API_VERSION",
    "WHATSAPP_BOOKING_TEMPLATE",
    "WHATSAPP_TEMPLATE_LANGUAGE",
  ],
  moloni: [
    "MOLONI_CLIENT_ID",
    "MOLONI_CLIENT_SECRET",
    "MOLONI_REFRESH_TOKEN",
    "INTEGRATION_TOKEN_ENCRYPTION_KEY",
  ],
  resend: ["RESEND_API_KEY", "RESEND_FROM_EMAIL"],
  meta: [
    "META_PIXEL_ID",
    "META_ACCESS_TOKEN",
    "META_GRAPH_API_VERSION",
    "META_TEST_EVENT_CODE",
    "NEXT_PUBLIC_SITE_URL",
  ],
};

function missingVariables(id: IntegrationId) {
  return REQUIRED_VARIABLES[id].filter((name) => !process.env[name]?.trim());
}

export function getIntegrationStatuses(): IntegrationStatus[] {
  return INTEGRATION_IDS.map((id) => {
    const requiredVariables = REQUIRED_VARIABLES[id];
    return {
      id,
      configured: missingVariables(id).length === 0,
      requiredVariables,
    };
  });
}

async function request(
  url: string,
  init?: RequestInit
): Promise<Record<string, unknown>> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const body = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  if (!response.ok) {
    throw new Error(`O serviço respondeu com HTTP ${response.status}.`);
  }
  return body;
}

export async function googleAccessToken() {
  const body = await request("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });
  if (typeof body.access_token !== "string") {
    throw new Error("O Google não devolveu um token de acesso.");
  }
  return body.access_token;
}

async function testGoogleCalendar() {
  const token = await googleAccessToken();
  const calendarId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID!);
  const body = await request(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return typeof body.summary === "string"
    ? `Calendário conectado: ${body.summary}.`
    : "Calendário conectado.";
}

async function zoomAccessToken() {
  const credentials = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString("base64");
  const body = await request(
    `https://zoom.us/oauth/token?${new URLSearchParams({
      grant_type: "account_credentials",
      account_id: process.env.ZOOM_ACCOUNT_ID!,
    })}`,
    {
      method: "POST",
      headers: { Authorization: `Basic ${credentials}` },
    }
  );
  if (typeof body.access_token !== "string") {
    throw new Error("O Zoom não devolveu um token de acesso.");
  }
  return body.access_token;
}

async function testZoom() {
  const token = await zoomAccessToken();
  const body = await request("https://api.zoom.us/v2/users/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return typeof body.email === "string"
    ? `Conta Zoom conectada: ${body.email}.`
    : "Conta Zoom conectada.";
}

async function testWhatsApp() {
  const version = process.env.WHATSAPP_API_VERSION!;
  if (!/^v\d+\.\d+$/.test(version)) {
    throw new Error("WHATSAPP_API_VERSION deve seguir o formato vNN.N.");
  }
  const phoneId = encodeURIComponent(process.env.WHATSAPP_PHONE_NUMBER_ID!);
  const body = await request(
    `https://graph.facebook.com/${version}/${phoneId}?fields=verified_name,display_phone_number`,
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      },
    }
  );
  return typeof body.display_phone_number === "string"
    ? `Número conectado: ${body.display_phone_number}.`
    : "Número WhatsApp conectado.";
}

function encryptionKey() {
  const encoded = process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY;
  if (!encoded) throw new Error("INTEGRATION_TOKEN_ENCRYPTION_KEY não configurada.");
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) {
    throw new Error("INTEGRATION_TOKEN_ENCRYPTION_KEY deve ter 32 bytes em Base64.");
  }
  return key;
}

function encrypt(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  return `${iv.toString("base64")}.${cipher.getAuthTag().toString("base64")}.${ciphertext.toString("base64")}`;
}

function decrypt(value: string) {
  const [iv, authTag, ciphertext] = value
    .split(".")
    .map((part) => Buffer.from(part, "base64"));
  if (!iv || !authTag || !ciphertext) {
    throw new Error("Credencial Moloni armazenada em formato inválido.");
  }
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}

async function moloniAccessToken() {
  const [stored] = await db
    .select()
    .from(integrationCredentials)
    .where(eq(integrationCredentials.provider, "moloni"))
    .limit(1);
  if (stored && stored.expiresAt.getTime() > Date.now() + 60_000) {
    return decrypt(stored.accessTokenEncrypted);
  }

  const refreshToken = stored
    ? decrypt(stored.refreshTokenEncrypted)
    : process.env.MOLONI_REFRESH_TOKEN;
  if (!refreshToken) {
    throw new Error("MOLONI_REFRESH_TOKEN não configurado.");
  }
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: process.env.MOLONI_CLIENT_ID!,
    client_secret: process.env.MOLONI_CLIENT_SECRET!,
    refresh_token: refreshToken,
  });
  const body = await request(
    `https://api.moloni.pt/v1/grant/?${params.toString()}`
  );
  if (
    typeof body.access_token !== "string" ||
    typeof body.refresh_token !== "string"
  ) {
    throw new Error("O Moloni não devolveu um token de acesso.");
  }
  const expiresIn = Number(body.expires_in);
  if (!Number.isFinite(expiresIn) || expiresIn <= 0) {
    throw new Error("O Moloni devolveu um prazo de acesso inválido.");
  }
  await db
    .insert(integrationCredentials)
    .values({
      provider: "moloni",
      accessTokenEncrypted: encrypt(body.access_token),
      refreshTokenEncrypted: encrypt(body.refresh_token),
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: integrationCredentials.provider,
      set: {
        accessTokenEncrypted: encrypt(body.access_token),
        refreshTokenEncrypted: encrypt(body.refresh_token),
        expiresAt: new Date(Date.now() + expiresIn * 1000),
        updatedAt: new Date(),
      },
    });
  return body.access_token;
}

async function testMoloni() {
  await moloniAccessToken();
  return "Autenticação Moloni renovada com sucesso.";
}

async function testResend() {
  const body = await request("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
  });
  const domains = Array.isArray(body.data) ? body.data : [];
  const senderDomain = process.env.RESEND_FROM_EMAIL!.split("@")
    .at(-1)
    ?.toLowerCase();
  const sender = domains.find(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      "name" in item &&
      typeof item.name === "string" &&
      item.name.toLowerCase() === senderDomain
  ) as { status?: string } | undefined;
  if (!sender || sender.status !== "verified") {
    throw new Error(
      "A chave é válida, mas o domínio do remetente não está verificado no Resend."
    );
  }
  return `Domínio de envio verificado: ${senderDomain}.`;
}

async function testMeta() {
  const version = process.env.META_GRAPH_API_VERSION!;
  if (!/^v\d+\.\d+$/.test(version)) {
    throw new Error("META_GRAPH_API_VERSION deve seguir o formato vNN.N.");
  }
  const pixelId = encodeURIComponent(process.env.META_PIXEL_ID!);
  const url = new URL(
    `https://graph.facebook.com/${version}/${pixelId}/events`
  );
  url.searchParams.set("access_token", process.env.META_ACCESS_TOKEN!);
  const body = await request(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      test_event_code: process.env.META_TEST_EVENT_CODE,
      data: [
        {
          event_name: "IntegrationTest",
          event_time: Math.floor(Date.now() / 1000),
          event_id: crypto.randomUUID(),
          action_source: "website",
          event_source_url: process.env.NEXT_PUBLIC_SITE_URL,
        },
      ],
    }),
  });
  if (body.events_received !== 1) {
    throw new Error("A Meta não confirmou o evento de teste.");
  }
  return "Evento de teste recebido no Gestor de Eventos da Meta.";
}

function lisbonDateToUtc(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute);
  let result = target;
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  for (let i = 0; i < 2; i++) {
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date(result))
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, Number(part.value)])
    );
    const represented = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    );
    result = target - (represented - result);
  }
  return new Date(result).toISOString();
}

function dateAfter(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1))
    .toISOString()
    .slice(0, 10);
}

function localTime(isoDate: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Lisbon",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(isoDate));
}

export async function getGoogleCalendarBusySlots(date: string) {
  const token = await googleAccessToken();
  const calendarId = process.env.GOOGLE_CALENDAR_ID!;
  const body = await request("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin: lisbonDateToUtc(date, "00:00"),
      timeMax: lisbonDateToUtc(dateAfter(date), "00:00"),
      timeZone: "Europe/Lisbon",
      items: [{ id: calendarId }],
    }),
  });
  const calendars =
    typeof body.calendars === "object" && body.calendars !== null
      ? (body.calendars as Record<string, unknown>)
      : {};
  const calendar =
    typeof calendars[calendarId] === "object" &&
    calendars[calendarId] !== null
      ? (calendars[calendarId] as Record<string, unknown>)
      : {};
  if (Array.isArray(calendar.errors) && calendar.errors.length > 0) {
    throw new Error("O Google Calendar não permitiu consultar a disponibilidade.");
  }
  if (!Array.isArray(calendar.busy)) {
    throw new Error("O Google Calendar não devolveu a disponibilidade.");
  }
  return calendar.busy.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null) return [];
    const busy = entry as Record<string, unknown>;
    if (typeof busy.start !== "string" || typeof busy.end !== "string") {
      return [];
    }
    return [{ startTime: localTime(busy.start), endTime: localTime(busy.end) }];
  });
}

export async function createZoomMeeting(input: {
  title: string;
  date: string;
  startTime: string;
  duration: number;
}) {
  const token = await zoomAccessToken();
  const body = await request("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: input.title,
      type: 2,
      start_time: lisbonDateToUtc(input.date, input.startTime),
      duration: input.duration,
      timezone: "Europe/Lisbon",
      settings: { waiting_room: true },
    }),
  });
  if (typeof body.join_url !== "string" || typeof body.id !== "number") {
    throw new Error("O Zoom não devolveu os dados da reunião.");
  }
  return { id: String(body.id), joinUrl: body.join_url };
}

export async function createGoogleCalendarEvent(input: {
  title: string;
  date: string;
  startTime: string;
  duration: number;
  attendeeEmail: string;
  description: string;
}) {
  const token = await googleAccessToken();
  const calendarId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID!);
  const start = new Date(lisbonDateToUtc(input.date, input.startTime));
  const end = new Date(start.getTime() + input.duration * 60_000);
  const body = await request(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?sendUpdates=all`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: input.title,
        description: input.description,
        start: { dateTime: start.toISOString(), timeZone: "Europe/Lisbon" },
        end: { dateTime: end.toISOString(), timeZone: "Europe/Lisbon" },
        attendees: [{ email: input.attendeeEmail }],
      }),
    }
  );
  if (typeof body.id !== "string") {
    throw new Error("O Google Calendar não devolveu o ID do evento.");
  }
  return body.id;
}

export async function sendBookingEmail(input: {
  to: string;
  name: string;
  title: string;
  date: string;
  startTime: string;
  zoomUrl: string | null;
}) {
  const body = await request("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: [input.to],
      subject: `Agendamento confirmado: ${input.title}`,
      text: [
        `Olá, ${input.name}.`,
        "",
        `O teu agendamento de ${input.title} está confirmado para ${input.date} às ${input.startTime} (hora de Lisboa).`,
        input.zoomUrl ? `Link da sessão: ${input.zoomUrl}` : "",
        "",
        "Marina Loyola",
      ]
        .filter(Boolean)
        .join("\n"),
    }),
  });
  if (typeof body.id !== "string") {
    throw new Error("O Resend não confirmou o envio do e-mail.");
  }
}

export async function sendWhatsAppBookingTemplate(input: {
  phone: string;
  name: string;
  title: string;
  date: string;
  startTime: string;
  zoomUrl: string | null;
}) {
  const version = process.env.WHATSAPP_API_VERSION!;
  if (!/^v\d+\.\d+$/.test(version)) {
    throw new Error("WHATSAPP_API_VERSION deve seguir o formato vNN.N.");
  }
  const phoneId = encodeURIComponent(process.env.WHATSAPP_PHONE_NUMBER_ID!);
  const body = await request(
    `https://graph.facebook.com/${version}/${phoneId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: input.phone.replace(/\D/g, ""),
        type: "template",
        template: {
          name: process.env.WHATSAPP_BOOKING_TEMPLATE,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: input.name },
                { type: "text", text: input.title },
                { type: "text", text: `${input.date} ${input.startTime}` },
                {
                  type: "text",
                  text: input.zoomUrl ?? "Link será enviado por e-mail",
                },
              ],
            },
          ],
        },
      }),
    }
  );
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    throw new Error("A WhatsApp API não confirmou o envio do template.");
  }
}

export async function testIntegration(id: IntegrationId) {
  const missing = missingVariables(id);
  if (missing.length) {
    throw new Error(`Configuração incompleta. Faltam: ${missing.join(", ")}.`);
  }

  switch (id) {
    case "hotmart":
      return "Segredo configurado. A conexão será confirmada quando chegar um webhook assinado da Hotmart.";
    case "google-calendar":
      return testGoogleCalendar();
    case "zoom":
      return testZoom();
    case "whatsapp":
      return testWhatsApp();
    case "moloni":
      return testMoloni();
    case "resend":
      return testResend();
    case "meta":
      return testMeta();
  }
}
