import { NextRequest, NextResponse } from "next/server";
import { addTagToContact, logInteraction, upsertContact } from "@/lib/crm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim();
    const name = String(body.name ?? "").trim() || "Lead do site";
    const interest = ["mentoria", "workshop", "design"].includes(body.interest)
      ? body.interest
      : "mentoria";

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
    }

    // Captação: lead entra no CRM com tag de origem + interesse + temperatura
    const contact = await upsertContact({
      name,
      email,
      origin: "site",
      productInterest: interest,
    });
    await addTagToContact(contact.id, interest);
    await addTagToContact(contact.id, "lead-frio");
    await logInteraction(
      contact.id,
      "email",
      "Descarregou o guia gratuito «7 erros de identidade visual» no site."
    );

    return NextResponse.json({ ok: true, contactId: contact.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
