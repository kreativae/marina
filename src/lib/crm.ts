import { db } from "@/db";
import { contacts, contactTags, interactions, tags } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function ensureTag(name: string) {
  const normalized = name.trim().toLowerCase();
  const [existing] = await db
    .select()
    .from(tags)
    .where(eq(tags.name, normalized))
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(tags)
    .values({ name: normalized })
    .onConflictDoNothing()
    .returning();
  if (created) return created;
  const [again] = await db
    .select()
    .from(tags)
    .where(eq(tags.name, normalized))
    .limit(1);
  return again;
}

export async function addTagToContact(contactId: number, tagName: string) {
  const tag = await ensureTag(tagName);
  const [existing] = await db
    .select()
    .from(contactTags)
    .where(
      and(eq(contactTags.contactId, contactId), eq(contactTags.tagId, tag.id))
    )
    .limit(1);
  if (!existing) {
    await db.insert(contactTags).values({ contactId, tagId: tag.id });
  }
}

export async function removeTagFromContact(contactId: number, tagId: number) {
  await db
    .delete(contactTags)
    .where(
      and(eq(contactTags.contactId, contactId), eq(contactTags.tagId, tagId))
    );
}

export async function upsertContact(data: {
  name: string;
  email: string;
  phone?: string | null;
  origin?: string;
  productInterest?: string;
}) {
  const email = data.email.trim().toLowerCase();
  const [existing] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.email, email))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(contacts)
      .set({
        name: data.name || existing.name,
        phone: data.phone ?? existing.phone,
        updatedAt: new Date(),
      })
      .where(eq(contacts.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(contacts)
    .values({
      name: data.name,
      email,
      phone: data.phone ?? null,
      origin: data.origin ?? "site",
      productInterest: data.productInterest ?? "mentoria",
    })
    .returning();
  return created;
}

export async function logInteraction(
  contactId: number,
  channel: string,
  content: string
) {
  await db.insert(interactions).values({ contactId, channel, content });
}
