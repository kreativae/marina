import "dotenv/config";
import { db } from "./index";
import {
  availabilityWindows,
  blockedSlots,
  bookings,
  campaigns,
  contactTags,
  contacts,
  deals,
  eventTypes,
  interactions,
  marketingTasks,
  posts,
  researchItems,
  tags,
} from "./schema";

function day(offset: number, h = 12) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(h, 0, 0, 0);
  return d;
}

function ymd(offset: number) {
  const d = day(offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("The demo seed cannot run in production.");
  }

  if (process.env.ALLOW_DESTRUCTIVE_SEED !== "true") {
    throw new Error(
      "This demo seed deletes existing data. Set ALLOW_DESTRUCTIVE_SEED=true to continue."
    );
  }

  console.log("A limpar tabelas…");
  await db.delete(contactTags);
  await db.delete(interactions);
  await db.delete(deals);
  await db.delete(bookings);
  await db.delete(availabilityWindows);
  await db.delete(blockedSlots);
  await db.delete(eventTypes);
  await db.delete(marketingTasks);
  await db.delete(posts);
  await db.delete(researchItems);
  await db.delete(campaigns);
  await db.delete(tags);
  await db.delete(contacts);

  // ——— Tags de sistema (A1) ———
  const tagRows = await db
    .insert(tags)
    .values(
      ["mentoria", "workshop", "design", "hotmart", "lead-frio", "lead-quente", "cliente"].map(
        (name) => ({ name })
      )
    )
    .returning();
  const tagId = (name: string) => tagRows.find((t) => t.name === name)!.id;

  // ——— Tipos de evento (A3) ———
  const ev = await db
    .insert(eventTypes)
    .values([
      {
        name: "Reunião de Descoberta",
        slug: "descoberta",
        duration: 30,
        description: "Conversa gratuita de 30 min para conhecer os teus objetivos.",
        tagPreset: "mentoria",
      },
      {
        name: "Sessão de Mentoria 1:1",
        slug: "mentoria",
        duration: 60,
        description: "Sessão individual de mentoria — carreira, portfólio e estratégia.",
        tagPreset: "mentoria",
      },
      {
        name: "Sessão de Workshop",
        slug: "workshop",
        duration: 90,
        description: "Acompanhamento ao vivo para alunos do workshop.",
        tagPreset: "workshop",
      },
    ])
    .returning();

  // ——— Disponibilidade semanal: seg–sex 09:30–12:30 e 14:00–18:00 (A3) ———
  const winValues = [1, 2, 3, 4, 5].flatMap((d) => [
    { dayOfWeek: d, startTime: "09:30", endTime: "12:30", active: true },
    { dayOfWeek: d, startTime: "14:00", endTime: "18:00", active: true },
  ]);
  await db.insert(availabilityWindows).values(winValues);

  // ——— Bloqueios importados do Google Calendar (A4) ———
  await db.insert(blockedSlots).values([
    { date: ymd(4), startTime: "12:00", endTime: "14:00", reason: "Almoço de equipa (Google Calendar)" },
    { date: ymd(6), startTime: "09:00", endTime: "12:30", reason: "Sessão de fotos para o novo site (Google Calendar)" },
  ]);

  // ——— Contactos (A6/A8) ———
  const c = await db
    .insert(contacts)
    .values([
      { name: "Ana Ribeiro", email: "ana.ribeiro@gmail.com", phone: "+351 912 344 821", origin: "site", productInterest: "mentoria", type: "cliente", status: "fechado", geography: "portugal", paymentStatus: "pago", createdAt: day(-42), updatedAt: day(-2) },
      { name: "João Pereira", email: "joao.pereira@outlook.pt", phone: "+351 934 210 556", origin: "instagram", productInterest: "mentoria", type: "lead", status: "em-contacto", geography: "portugal", paymentStatus: "pendente", createdAt: day(-16), updatedAt: day(-10) },
      { name: "Sofia Martins", email: "sofia.martins@gmail.com", phone: "+44 7700 900312", origin: "hotmart", productInterest: "workshop", type: "cliente", status: "fechado", geography: "internacional", paymentStatus: "pago", createdAt: day(-21), updatedAt: day(-3) },
      { name: "Carlos Nogueira", email: "carlos.nogueira@empresa.pt", phone: "+351 217 555 010", origin: "indicacao", productInterest: "design", type: "lead", status: "proposta", geography: "portugal", paymentStatus: "pendente", createdAt: day(-12), updatedAt: day(-1) },
      { name: "Marta Silva", email: "marta.silva@gmail.com", phone: "+351 968 124 377", origin: "ads", productInterest: "workshop", type: "lead", status: "novo", geography: "portugal", paymentStatus: "pendente", createdAt: day(-2), updatedAt: day(-2) },
      { name: "Diego Fernández", email: "diego.fernandez@gmail.com", phone: "+34 612 345 678", origin: "hotmart", productInterest: "workshop", type: "cliente", status: "fechado", geography: "internacional", paymentStatus: "pago", createdAt: day(-75), updatedAt: day(-70) },
      { name: "Inês Costa", email: "ines.costa@gmail.com", phone: "+351 913 882 144", origin: "site", productInterest: "mentoria", type: "lead", status: "em-contacto", geography: "portugal", paymentStatus: "pendente", createdAt: day(-6), updatedAt: day(0, 9) },
      { name: "Lucas Oliveira", email: "lucas.oliveira@hotmail.com", phone: "+55 11 98888 1234", origin: "hotmart", productInterest: "workshop", type: "cliente", status: "fechado", geography: "internacional", paymentStatus: "pago", createdAt: day(-110), updatedAt: day(-105) },
      { name: "Beatriz Fonseca", email: "beatriz.fonseca@gmail.com", phone: "+351 925 771 093", origin: "instagram", productInterest: "design", type: "lead", status: "novo", geography: "portugal", paymentStatus: "pendente", createdAt: day(-14), updatedAt: day(-12) },
      { name: "Tomás Almeida", email: "tomas.almeida@gmail.com", phone: "+351 962 330 418", origin: "indicacao", productInterest: "mentoria", type: "cliente", status: "fechado", geography: "portugal", paymentStatus: "pago", createdAt: day(-52), updatedAt: day(-20) },
      { name: "Emma Johnson", email: "emma.johnson@gmail.com", phone: "+1 415 555 0132", origin: "ads", productInterest: "mentoria", type: "lead", status: "perdido", geography: "internacional", paymentStatus: "pendente", createdAt: day(-28), updatedAt: day(-19) },
      { name: "Rui Tavares", email: "rui.tavares@studio.pt", phone: "+351 917 445 266", origin: "outro", productInterest: "design", type: "cliente", status: "fechado", geography: "portugal", paymentStatus: "pago", createdAt: day(-90), updatedAt: day(-60) },
      { name: "Camila Duarte", email: "camila.duarte@gmail.com", phone: "+351 933 551 742", origin: "site", productInterest: "workshop", type: "lead", status: "em-contacto", geography: "portugal", paymentStatus: "pendente", createdAt: day(-4), updatedAt: day(-1) },
      { name: "Nuno Carvalho", email: "nuno.carvalho@gmail.com", phone: "+351 914 662 830", origin: "instagram", productInterest: "mentoria", type: "lead", status: "novo", geography: "portugal", paymentStatus: "pendente", createdAt: day(-1), updatedAt: day(-1) },
      { name: "Helena Brum", email: "helena.brum@gmail.com", phone: "+351 911 208 445", origin: "hotmart", productInterest: "workshop", type: "ex-cliente", status: "fechado", geography: "portugal", paymentStatus: "reembolsado", createdAt: day(-130), updatedAt: day(-40) },
    ])
    .returning();
  const cid = (email: string) => c.find((x) => x.email === email)!.id;

  // ——— Tags por contacto ———
  const ctValues: { contactId: number; tagId: number }[] = [];
  const addTags = (email: string, names: string[]) =>
    names.forEach((n) => ctValues.push({ contactId: cid(email), tagId: tagId(n) }));
  addTags("ana.ribeiro@gmail.com", ["mentoria", "lead-quente", "cliente"]);
  addTags("joao.pereira@outlook.pt", ["mentoria", "lead-quente"]);
  addTags("sofia.martins@gmail.com", ["workshop", "hotmart", "cliente"]);
  addTags("carlos.nogueira@empresa.pt", ["design", "lead-quente"]);
  addTags("marta.silva@gmail.com", ["workshop", "lead-frio"]);
  addTags("diego.fernandez@gmail.com", ["workshop", "hotmart", "cliente"]);
  addTags("ines.costa@gmail.com", ["mentoria", "lead-frio"]);
  addTags("lucas.oliveira@hotmail.com", ["workshop", "hotmart", "cliente"]);
  addTags("beatriz.fonseca@gmail.com", ["design", "lead-frio"]);
  addTags("tomas.almeida@gmail.com", ["mentoria", "cliente"]);
  addTags("emma.johnson@gmail.com", ["mentoria", "lead-frio"]);
  addTags("rui.tavares@studio.pt", ["design", "cliente"]);
  addTags("camila.duarte@gmail.com", ["workshop", "lead-quente"]);
  addTags("nuno.carvalho@gmail.com", ["mentoria", "lead-frio"]);
  addTags("helena.brum@gmail.com", ["workshop", "hotmart", "cliente"]);
  await db.insert(contactTags).values(ctValues);

  // ——— Interações (histórico) ———
  await db.insert(interactions).values([
    { contactId: cid("ana.ribeiro@gmail.com"), channel: "whatsapp", content: "Enviado comprovativo MBWay da 3.ª mensalidade. Fatura emitida no Moloni.", createdAt: day(-3, 10) },
    { contactId: cid("ana.ribeiro@gmail.com"), channel: "email", content: "Materiais da sessão 4 enviados: workbook de posicionamento + gravação Zoom.", createdAt: day(-2, 18) },
    { contactId: cid("joao.pereira@outlook.pt"), channel: "whatsapp", content: "Conversa inicial sobre objetivos. Interesse na mentoria mensal. Sem resposta há 9 dias — reativar.", createdAt: day(-10, 15) },
    { contactId: cid("sofia.martins@gmail.com"), channel: "sistema", content: "Webhook Hotmart — compra do Workshop (€47). Tag #cliente-workshop aplicada. Recibo automático Hotmart.", createdAt: day(-21, 20) },
    { contactId: cid("carlos.nogueira@empresa.pt"), channel: "email", content: "Proposta de rebranding enviada (€1.800). Aguarda validação do sócio.", createdAt: day(-1, 11) },
    { contactId: cid("marta.silva@gmail.com"), channel: "sistema", content: "Lead vindo de Meta Ads (campanha Workshop). Tag #lead-frio.", createdAt: day(-2, 8) },
    { contactId: cid("ines.costa@gmail.com"), channel: "sistema", content: "Agendamento: Reunião de Descoberta. Sala Zoom criada; link enviado por e-mail.", createdAt: day(0, 9) },
    { contactId: cid("camila.duarte@gmail.com"), channel: "whatsapp", content: "Perguntou sobre datas do próximo workshop ao vivo. Enviada página de checkout Hotmart.", createdAt: day(-1, 16) },
    { contactId: cid("tomas.almeida@gmail.com"), channel: "chamada", content: "Sessão de fecho da mentoria trimestral. Próximo passo: revisão de portfólio em setembro.", createdAt: day(-20, 12) },
    { contactId: cid("helena.brum@gmail.com"), channel: "sistema", content: "Webhook Hotmart — REEMBOLSO do workshop processado. Estado de pagamento atualizado.", createdAt: day(-40, 14) },
  ]);

  // ——— Deals / Pipeline (A7) ———
  await db.insert(deals).values([
    { contactId: cid("ana.ribeiro@gmail.com"), title: "Mentoria 1:1 trimestral", product: "mentoria", value: 120000, paymentMethod: "mbway", expectedCloseDate: ymd(-35), stage: "pos-venda", createdAt: day(-42), updatedAt: day(-2) },
    { contactId: cid("joao.pereira@outlook.pt"), title: "Mentoria mensal", product: "mentoria", value: 49000, paymentMethod: "mbway", expectedCloseDate: ymd(5), stage: "contactado", createdAt: day(-16), updatedAt: day(-10) },
    { contactId: cid("sofia.martins@gmail.com"), title: "Workshop — Identidade Visual na Prática", product: "workshop", value: 4700, paymentMethod: "hotmart", expectedCloseDate: ymd(-21), stage: "entregue", createdAt: day(-21), updatedAt: day(-3) },
    { contactId: cid("carlos.nogueira@empresa.pt"), title: "Rebranding Studio Nogueira", product: "design", value: 180000, paymentMethod: "transferencia", expectedCloseDate: ymd(9), stage: "proposta", createdAt: day(-12), updatedAt: day(-1) },
    { contactId: cid("marta.silva@gmail.com"), title: "Workshop — edição de julho", product: "workshop", value: 4700, paymentMethod: "hotmart", expectedCloseDate: ymd(12), stage: "novo-lead", createdAt: day(-2), updatedAt: day(-2) },
    { contactId: cid("diego.fernandez@gmail.com"), title: "Workshop — edição de março", product: "workshop", value: 4700, paymentMethod: "hotmart", expectedCloseDate: ymd(-75), stage: "entregue", createdAt: day(-75), updatedAt: day(-70) },
    { contactId: cid("ines.costa@gmail.com"), title: "Mentoria mensal", product: "mentoria", value: 49000, paymentMethod: "mbway", expectedCloseDate: ymd(14), stage: "interessado", createdAt: day(-6), updatedAt: day(0, 9) },
    { contactId: cid("lucas.oliveira@hotmail.com"), title: "Workshop — edição de janeiro", product: "workshop", value: 4700, paymentMethod: "hotmart", expectedCloseDate: ymd(-110), stage: "entregue", createdAt: day(-110), updatedAt: day(-105) },
    { contactId: cid("beatriz.fonseca@gmail.com"), title: "Identidade visual completa", product: "design", value: 95000, paymentMethod: "transferencia", expectedCloseDate: ymd(18), stage: "contactado", createdAt: day(-14), updatedAt: day(-12) },
    { contactId: cid("tomas.almeida@gmail.com"), title: "Mentoria trimestral", product: "mentoria", value: 120000, paymentMethod: "transferencia", expectedCloseDate: ymd(-30), stage: "pagamento", createdAt: day(-52), updatedAt: day(-25) },
    { contactId: cid("camila.duarte@gmail.com"), title: "Workshop — edição de julho", product: "workshop", value: 4700, paymentMethod: "hotmart", expectedCloseDate: ymd(10), stage: "interessado", createdAt: day(-4), updatedAt: day(-1) },
    { contactId: cid("rui.tavares@studio.pt"), title: "Consultoria de marca", product: "design", value: 220000, paymentMethod: "transferencia", expectedCloseDate: ymd(-58), stage: "pos-venda", createdAt: day(-90), updatedAt: day(-60) },
    { contactId: cid("emma.johnson@gmail.com"), title: "Mentoria 1:1", product: "mentoria", value: 49000, paymentMethod: "cartao", expectedCloseDate: ymd(-20), stage: "novo-lead", createdAt: day(-28), updatedAt: day(-19) },
  ]);

  // ——— Agendamentos (A3/A5/A11) ———
  await db.insert(bookings).values([
    { eventTypeId: ev[1].id, contactName: "Ana Ribeiro", contactEmail: "ana.ribeiro@gmail.com", contactPhone: "+351 912 344 821", date: ymd(2), startTime: "10:00", status: "confirmado", zoomLink: "https://zoom.us/j/8827419056?pwd=ml-ment", notes: "Sessão 5 — revisão de preços." },
    { eventTypeId: ev[2].id, contactName: "Sofia Martins", contactEmail: "sofia.martins@gmail.com", contactPhone: "+44 7700 900312", date: ymd(3), startTime: "15:00", status: "confirmado", zoomLink: "https://zoom.us/j/7712458093?pwd=ml-wkshp", linkSentWhatsapp: true },
    { eventTypeId: ev[0].id, contactName: "Inês Costa", contactEmail: "ines.costa@gmail.com", contactPhone: "+351 913 882 144", date: ymd(1), startTime: "11:30", status: "confirmado", zoomLink: "https://zoom.us/j/9903124578?pwd=ml-disc" },
    { eventTypeId: ev[1].id, contactName: "Tomás Almeida", contactEmail: "tomas.almeida@gmail.com", contactPhone: "+351 962 330 418", date: ymd(5), startTime: "14:00", status: "confirmado", zoomLink: "https://zoom.us/j/8451902763?pwd=ml-ment" },
    { eventTypeId: ev[0].id, contactName: "Camila Duarte", contactEmail: "camila.duarte@gmail.com", contactPhone: "+351 933 551 742", date: ymd(-3), startTime: "10:00", status: "concluido", zoomLink: "https://zoom.us/j/8120956347?pwd=ml-disc", linkSentWhatsapp: true },
    { eventTypeId: ev[1].id, contactName: "Ana Ribeiro", contactEmail: "ana.ribeiro@gmail.com", contactPhone: "+351 912 344 821", date: ymd(-8), startTime: "10:00", status: "concluido", zoomLink: "https://zoom.us/j/8091725346?pwd=ml-ment", linkSentWhatsapp: true },
  ]);

  // ——— Pipeline de marketing (B2) ———
  await db.insert(marketingTasks).values([
    { title: "Novo módulo do Workshop — Teoria da Cor", owner: "Marina", deadline: ymd(12), stage: "producao", notes: "Gravar 4 aulas. Referências: paleta Bauhaus, estudos Albers." },
    { title: "Sequência de e-mails pós-webinar", owner: "Rita", deadline: ymd(7), stage: "revisao", notes: "5 e-mails: obrigada → replay → prova social → oferta workshop → última chamada." },
    { title: "Rebranding do perfil de Instagram", owner: "Marina", deadline: ymd(4), stage: "aprovado", notes: "Nova grelha: preto/branco/roxo. Templates de carrossel atualizados no Figma." },
    { title: "Landing page do Workshop (Hotmart)", owner: "Marina", deadline: ymd(-10), stage: "publicado", notes: "https://marinaloyola.com — funis ativos. CTA mentoria → WhatsApp; workshop → checkout." },
    { title: "Inquérito de satisfação aos alunos", owner: "Rita", deadline: ymd(20), stage: "ideia", notes: "Google Forms → resultados entram em Pesquisa de Mercado." },
    { title: "Campanha Meta Ads — Mentoria", owner: "Marina", deadline: ymd(15), stage: "planeamento", notes: "Orçamento €150/sem. Público: visitantes do site + lookalike de clientes." },
    { title: "Kit de boas-vindas (materiais PDF)", owner: "Rita", deadline: ymd(9), stage: "producao", notes: "Enviado automaticamente por e-mail após confirmação de pagamento." },
    { title: "Parceria com podcast «Design em Português»", owner: "Marina", deadline: ymd(30), stage: "ideia", notes: "Propor episódio sobre pricing para freelancers." },
    { title: "Atualizar portfólio no site", owner: "Marina", deadline: ymd(6), stage: "revisao", notes: "3 novos case studies com processo documentado." },
    { title: "Newsletter de verão", owner: "Rita", deadline: ymd(3), stage: "aprovado", notes: "Tema: «como preparar o portfólio para setembro»." },
  ]);

  // ——— Posts / Calendário editorial + Esteira Instagram (B4/B5/B6) ———
  await db.insert(posts).values([
    { date: ymd(-19), time: "18:00", platform: "instagram", theme: "Antes/depois: rebranding da Mercearia 88", format: "carrossel", copy: "O poder de uma identidade coerente…", hashtags: "#branding #rebranding #identidadevisual", owner: "Marina", stage: "analisado", reach: 8400, engagement: 7, saves: 210 },
    { date: ymd(-16), time: "12:30", platform: "instagram", theme: "3 erros ao escolher tipografia", format: "reels", copy: "Guarda este para o próximo projeto.", hashtags: "#tipografia #design #fontes", owner: "Marina", stage: "analisado", reach: 12600, engagement: 6, saves: 340 },
    { date: ymd(-13), time: "09:00", platform: "linkedin", theme: "Case study: como a Ana triplicou o valor dos projetos", format: "post", copy: "Mentoria não é magia. É método.", owner: "Marina", stage: "publicado", reach: 2300, engagement: 4, saves: 0 },
    { date: ymd(-10), time: "10:00", platform: "email", theme: "Newsletter quinzenal — O custo de não ter identidade", format: "newsletter", owner: "Rita", stage: "publicado", reach: 1180, engagement: 0, saves: 0 },
    { date: ymd(-8), time: "18:30", platform: "instagram", theme: "Bastidores: gravação do módulo de cor", format: "story", owner: "Marina", stage: "publicado", reach: 1900, engagement: 3, saves: 0 },
    { date: ymd(-5), time: "19:00", platform: "instagram", theme: "Como definir a tua identidade visual em 5 passos", format: "carrossel", copy: "Passo 1: começa pelo porquê…", hashtags: "#identidadevisual #branding #designde0a5", owner: "Marina", stage: "analisado", reach: 7200, engagement: 8, saves: 265 },
    { date: ymd(-2), time: "08:00", platform: "blog", theme: "Guia: preços para designers freelancers em 2025", format: "artigo", owner: "Marina", stage: "publicado", reach: 640, engagement: 0, saves: 0 },
    { date: ymd(0), time: "10:00", platform: "instagram", theme: "Pergunta rápida: quanto cobras por um logótipo?", format: "story", copy: "Caixa de pergunta + sondagem", owner: "Marina", stage: "agendado" },
    { date: ymd(2), time: "18:00", platform: "instagram", theme: "Depoimento da Sofia (Londres) — workshop", format: "post", copy: "«Denso no melhor sentido.»", owner: "Marina", stage: "aprovado" },
    { date: ymd(4), time: "12:00", platform: "instagram", theme: "Reels: um minuto a escolher a paleta certa", format: "reels", copy: "Roxo #800080 forever.", hashtags: "#paleta #cores #designtips", owner: "Rita", stage: "revisao" },
    { date: ymd(7), time: "09:30", platform: "linkedin", theme: "Anúncio: nova edição do workshop em agosto", format: "post", owner: "Marina", stage: "criacao" },
    { date: ymd(8), time: "10:00", platform: "email", theme: "Newsletter — bastidores da mentoria", format: "newsletter", owner: "Rita", stage: "criacao" },
    { date: ymd(10), time: "18:00", platform: "instagram", theme: "Carrossel: anatomia de um portfólio que vende", format: "carrossel", designLink: "https://canva.com/design/marina-portfolio", owner: "Marina", stage: "ideia" },
    { date: ymd(14), time: "19:00", platform: "instagram", theme: "Live Q&A com alunos do workshop", format: "video", owner: "Marina", stage: "ideia" },
  ]);

  // ——— Pesquisa de mercado (B1) ———
  await db.insert(researchItems).values([
    { type: "concorrencia", title: "Análise — mentores de design em PT", content: "3 concorrentes diretos: preços entre €300–€900/mês. Nenhum oferece acompanhamento por WhatsApp — diferencial claro da Marina. Todos comunicam em PT-informal." },
    { type: "concorrencia", title: "Benchmark — workshops na Hotmart", content: "Top 5 na categoria design: preço médio R$97 (~€17). Edição da Marina a €47 posiciona-se como premium. Título com promessa concreta converte 2,3× mais." },
    { type: "persona", title: "Persona: Inês, a freelancer perdida", content: "26–32 anos, 2–4 anos de experiência, cobra pouco por medo de perder clientes. Consome conteúdo no Instagram à noite. Objeção principal: «será que vale o investimento?»." },
    { type: "persona", title: "Persona: Marco, o designer em transição", content: "34–41 anos, vem de agências, quer independência. Precisa de posicionamento e pricing. Prefere e-mail a WhatsApp. Converte bem via LinkedIn." },
    { type: "tendencia", title: "Tendência: tipografia expressiva 2025", content: "Serifadas com italic + monospace funcional dominam os rebrands. Movimento «anti-flat». Oportunidade: carrossel «5 fontes que vão dominar 2025»." },
    { type: "tendencia", title: "Tendência: mentorias em micro-formatos", content: "Mercado a valorizar sessões curtas e baratas (30–45 min). Testar oferta de «sessão avulsa» na página /agendar." },
    { type: "inquerito", title: "Inquérito pós-workshop — março (n=38)", content: "Satisfação 4,8/5. Pedidos mais frequentes: módulo de pricing (63%), templates de proposta (52%). NPS 71. 12 alunos interessados em mentoria." },
    { type: "documento", title: "Referências visuais — moodboard do sistema", content: "Links Figma: moodboard preto/branco/roxo, grids editoriais, tipografia Fraunces. Base para templates de Instagram e e-mails." },
  ]);

  // ——— Campanhas de re-marketing (B3) ———
  await db.insert(campaigns).values([
    { name: "Newsletter quinzenal", type: "newsletter", channel: "email", frequency: "quinzenal", segment: "todos", status: "ativa" },
    { name: "Meta Ads — remarketing de visitantes do site", type: "ads", channel: "meta-ads", frequency: "continua", segment: "lead-frio", status: "ativa" },
    { name: "Webinar: Portfólio que vende", type: "evento", channel: "email+whatsapp", frequency: "por evento", segment: "lead-quente", status: "rascunho" },
    { name: "Black Friday — 40% no Workshop", type: "comemoracao", channel: "email", frequency: "sazonal", segment: "todos", status: "pausada" },
    { name: "Sequência pós-download do guia gratuito", type: "sequencia", channel: "email", frequency: "trigger-based", segment: "lead-frio", status: "ativa" },
    { name: "Reengajamento de ex-clientes", type: "sequencia", channel: "email", frequency: "trigger-based", segment: "ex-cliente", status: "ativa" },
  ]);

  console.log("Seed concluído com sucesso.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
