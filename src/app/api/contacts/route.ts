import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts, contactTags, deals, tags } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import {
  addTagToContact,
  ensureTag,
  logInteraction,
  upsertContact,
} from "@/lib/crm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const rows = await db.select().from(contacts).orderBy(desc(contacts.updatedAt));
  const ct = await db
    .select({
      contactId: contactTags.contactId,
      tagId: contactTags.tagId,
      name: tags.name,
    })
    .from(contactTags)
    .innerJoin(tags, eq(contactTags.tagId, tags.id));

  const tagMap = new Map<number, { id: number; name: string }[]>();
  for (const row of ct) {
    const arr = tagMap.get(row.contactId) ?? [];
    arr.push({ id: row.tagId, name: row.name });
    tagMap.set(row.contactId, arr);
  }

  const search = (p.get("search") ?? "").toLowerCase();
  const filtered = rows
    .map((c) => ({ ...c, tags: tagMap.get(c.id) ?? [] }))
    .filter((c) => {
      if (search && !`${c.name} ${c.email} ${c.phone ?? ""}`.toLowerCase().includes(search))
        return false;
      if (p.get("origin") && c.origin !== p.get("origin")) return false;
      if (p.get("product") && c.productInterest !== p.get("product")) return false;
      if (p.get("type") && c.type !== p.get("type")) return false;
      if (p.get("status") && c.status !== p.get("status")) return false;
      if (p.get("geography") && c.geography !== p.get("geography")) return false;
      if (p.get("payment") && c.paymentStatus !== p.get("payment")) return false;
      if (
        p.get("tag") &&
        !(tagMap.get(c.id) ?? []).some((t) => t.name === p.get("tag"))
      )
        return false;
      return true;
    });

  return NextResponse.json(filtered);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  if (!name || !email.includes("@")) {
    return NextResponse.json(
      { error: "Nome e e-mail válido são obrigatórios" },
      { status: 400 }
    );
  }

  const contact = await upsertContact({
    name,
    email,
    phone: body.phone ?? null,
    origin: body.origin ?? "site",
    productInterest: body.productInterest ?? "mentoria",
  });

  const patch: Partial<typeof contacts.$inferInsert> = {};
  if (body.type) patch.type = body.type;
  if (body.status) patch.status = body.status;
  if (body.geography) patch.geography = body.geography;
  if (body.paymentStatus) patch.paymentStatus = body.paymentStatus;
  if (body.notes !== undefined) patch.notes = body.notes;
  if (Object.keys(patch).length) {
    await db.update(contacts).set(patch).where(eq(contacts.id, contact.id));
  }

  if (Array.isArray(body.tags)) {
    for (const t of body.tags) await addTagToContact(contact.id, String(t));
  }
  await logInteraction(contact.id, "sistema", "Contacto criado manualmente no CRM.");

  return NextResponse.json(contact, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const id = Number(body.id);
  if (!id) return NextResponse.json({ error: "id em falta" }, { status: 400 });

  const patch: Partial<typeof contacts.$inferInsert> = { updatedAt: new Date() };
  for (const key of [
    "name",
    "email",
    "phone",
    "origin",
    "productInterest",
    "type",
    "status",
    "geography",
    "paymentStatus",
    "notes",
  ] as const) {
    if (body[key] !== undefined) patch[key] = body[key];
  }
  const [updated] = await db
    .update(contacts)
    .set(patch)
    .where(eq(contacts.id, id))
    .returning();

  // Sincronizar tags se enviadas (lista completa de nomes)
  if (Array.isArray(body.tags)) {
    const wanted: string[] = body.tags.map((t: string) =>
      t.trim().toLowerCase().replace(/^#/, "")
    );
    const current = await db
      .select({ id: contactTags.id, tagId: contactTags.tagId, name: tags.name })
      .from(contactTags)
      .innerJoin(tags, eq(contactTags.tagId, tags.id))
      .where(eq(contactTags.contactId, id));

    const currentNames = new Set(current.map((c) => c.name));
    for (const name of wanted) {
      if (!currentNames.has(name)) await addTagToContact(id, name);
    }
    const toRemove = current
      .filter((c) => !wanted.includes(c.name))
      .map((c) => c.id);
    if (toRemove.length) {
      await db.delete(contactTags).where(inArray(contactTags.id, toRemove));
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id em falta" }, { status: 400 });
  await db.delete(deals).where(eq(deals.contactId, id));
  await db.delete(contacts).where(eq(contacts.id, id));
  return NextResponse.json({ ok: true });
}

// Exportado para uso interno (webhooks)
export { ensureTag };
