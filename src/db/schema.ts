import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// ─── MÓDULO A — CRM / PROCESSOS COMERCIAIS ──────────────────────────────────

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  // site | instagram | hotmart | indicacao | ads | outro
  origin: text("origin").notNull().default("site"),
  // mentoria | workshop | design
  productInterest: text("product_interest").notNull().default("mentoria"),
  // lead | cliente | ex-cliente
  type: text("type").notNull().default("lead"),
  // novo | em-contacto | proposta | fechado | perdido
  status: text("status").notNull().default("novo"),
  // portugal | internacional
  geography: text("geography").notNull().default("portugal"),
  // pago | pendente | atrasado | reembolsado
  paymentStatus: text("payment_status").notNull().default("pendente"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const contactTags = pgTable("contact_tags", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id")
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  tagId: integer("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
});

export const interactions = pgTable("interactions", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id")
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  // whatsapp | email | chamada | sistema
  channel: text("channel").notNull().default("whatsapp"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Pipeline de vendas (Kanban)
export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id")
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  product: text("product").notNull().default("mentoria"),
  value: integer("value").notNull().default(0), // em cêntimos
  // mbway | transferencia | hotmart | cartao | outro
  paymentMethod: text("payment_method").notNull().default(""),
  expectedCloseDate: date("expected_close_date", { mode: "string" }),
  // novo-lead | contactado | interessado | proposta | pagamento | entregue | pos-venda
  stage: text("stage").notNull().default("novo-lead"),
  staleDays: integer("stale_days").notNull().default(7),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── AGENDA (A3/A4/A5) ───────────────────────────────────────────────────────

export const eventTypes = pgTable("event_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  duration: integer("duration").notNull().default(60), // minutos
  description: text("description"),
  // mentoria | workshop | design | outro — usado para tagging automática
  tagPreset: text("tag_preset").notNull().default("mentoria"),
  active: boolean("active").notNull().default(true),
});

export const availabilityWindows = pgTable("availability_windows", {
  id: serial("id").primaryKey(),
  dayOfWeek: integer("day_of_week").notNull(), // 0 domingo — 6 sábado
  startTime: text("start_time").notNull(), // "09:30"
  endTime: text("end_time").notNull(), // "12:30"
  active: boolean("active").notNull().default(true),
});

// Bloqueios sincronizados a partir do Google Calendar (A4)
export const blockedSlots = pgTable("blocked_slots", {
  id: serial("id").primaryKey(),
  date: date("date", { mode: "string" }).notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  reason: text("reason").notNull().default(""),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  eventTypeId: integer("event_type_id")
    .notNull()
    .references(() => eventTypes.id, { onDelete: "cascade" }),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  date: date("date", { mode: "string" }).notNull(),
  startTime: text("start_time").notNull(),
  // confirmado | concluido | cancelado
  status: text("status").notNull().default("confirmado"),
  zoomLink: text("zoom_link"),
  googleSynced: boolean("google_synced").notNull().default(true),
  zoomSentEmail: boolean("zoom_sent_email").notNull().default(true),
  linkSentWhatsapp: boolean("link_sent_whatsapp").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── MÓDULO B — MARKETING ────────────────────────────────────────────────────

// B2 — Pipeline de processos de marketing
export const marketingTasks = pgTable("marketing_tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  owner: text("owner").notNull().default("Marina"),
  deadline: date("deadline", { mode: "string" }),
  // ideia | planeamento | producao | revisao | aprovado | publicado
  stage: text("stage").notNull().default("ideia"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// B4/B5/B6 — Calendário editorial + Fichas de conteúdo + Esteira Instagram
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  date: date("date", { mode: "string" }).notNull(),
  time: text("time").notNull().default("10:00"),
  // instagram | linkedin | email | blog
  platform: text("platform").notNull().default("instagram"),
  theme: text("theme").notNull(),
  // reels | carrossel | story | post | video | artigo | newsletter
  format: text("format").notNull().default("post"),
  copy: text("copy"),
  hashtags: text("hashtags"),
  designLink: text("design_link"),
  owner: text("owner").notNull().default("Marina"),
  // ideia | criacao | revisao | aprovado | agendado | publicado | analisado
  stage: text("stage").notNull().default("ideia"),
  reach: integer("reach").notNull().default(0),
  engagement: integer("engagement").notNull().default(0),
  saves: integer("saves").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// B1 — Pesquisa de mercado
export const researchItems = pgTable("research_items", {
  id: serial("id").primaryKey(),
  // concorrencia | persona | tendencia | inquerito | documento
  type: text("type").notNull().default("concorrencia"),
  title: text("title").notNull(),
  content: text("content"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// B3 — Re-marketing e comunicações
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  // newsletter | ads | evento | comemoracao | sequencia
  type: text("type").notNull().default("newsletter"),
  channel: text("channel").notNull().default("email"),
  frequency: text("frequency").notNull().default("semanal"),
  segment: text("segment").notNull().default("todos"),
  // rascunho | ativa | pausada | concluida
  status: text("status").notNull().default("rascunho"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── RELAÇÕES ────────────────────────────────────────────────────────────────

export const contactsRelations = relations(contacts, ({ many }) => ({
  contactTags: many(contactTags),
  interactions: many(interactions),
  deals: many(deals),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  contactTags: many(contactTags),
}));

export const contactTagsRelations = relations(contactTags, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactTags.contactId],
    references: [contacts.id],
  }),
  tag: one(tags, {
    fields: [contactTags.tagId],
    references: [tags.id],
  }),
}));

export const interactionsRelations = relations(interactions, ({ one }) => ({
  contact: one(contacts, {
    fields: [interactions.contactId],
    references: [contacts.id],
  }),
}));

export const dealsRelations = relations(deals, ({ one }) => ({
  contact: one(contacts, {
    fields: [deals.contactId],
    references: [contacts.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  eventType: one(eventTypes, {
    fields: [bookings.eventTypeId],
    references: [eventTypes.id],
  }),
}));
