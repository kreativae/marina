import { NextRequest, NextResponse } from "next/server";
import {
  getIntegrationStatuses,
  INTEGRATION_IDS,
  testIntegration,
  type IntegrationId,
} from "@/lib/integrations";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ integrations: getIntegrationStatuses() });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const id = (body as { id?: unknown })?.id;
  if (
    typeof id !== "string" ||
    !INTEGRATION_IDS.includes(id as IntegrationId)
  ) {
    return NextResponse.json(
      { error: "Integração desconhecida." },
      { status: 400 }
    );
  }

  try {
    const message = await testIntegration(id as IntegrationId);
    return NextResponse.json({ ok: true, message });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível testar a integração.";
    return NextResponse.json({ ok: false, message }, { status: 502 });
  }
}
