// Definições partilhadas — Sistema Marina Loyola
// Paleta: Preto #000000 · Branco #FFFFFF · Roxo #800080

export const BRAND = {
  black: "#000000",
  white: "#FFFFFF",
  purple: "#800080",
  purpleLight: "#F5EBF5",
  purpleMid: "#B266B2",
  paper: "#FAF8F7",
};

export const WHATSAPP_NUMBER = "351912345678";
export const WHATSAPP_MENTORIA_MSG =
  "Olá Marina! Vim do teu site e quero saber mais sobre a Mentoria.";
export const HOTMART_CHECKOUT_URL = "https://pay.hotmart.com/workshop-identidade-visual";

export const DEAL_STAGES = [
  { id: "novo-lead", label: "Novo Lead" },
  { id: "contactado", label: "Contactado" },
  { id: "interessado", label: "Interessado" },
  { id: "proposta", label: "Proposta / Checkout" },
  { id: "pagamento", label: "Pagamento Recebido" },
  { id: "entregue", label: "Entregue" },
  { id: "pos-venda", label: "Pós-venda" },
] as const;

export const MARKETING_STAGES = [
  { id: "ideia", label: "Ideia" },
  { id: "planeamento", label: "Em Planeamento" },
  { id: "producao", label: "Em Produção" },
  { id: "revisao", label: "Revisão" },
  { id: "aprovado", label: "Aprovado" },
  { id: "publicado", label: "Publicado / Executado" },
] as const;

export const INSTAGRAM_STAGES = [
  { id: "ideia", label: "Ideia" },
  { id: "criacao", label: "Em Criação" },
  { id: "revisao", label: "Revisão" },
  { id: "aprovado", label: "Aprovado" },
  { id: "agendado", label: "Agendado" },
  { id: "publicado", label: "Publicado" },
  { id: "analisado", label: "Analisado" },
] as const;

export const ORIGINS = [
  { id: "site", label: "Site" },
  { id: "instagram", label: "Instagram" },
  { id: "hotmart", label: "Hotmart" },
  { id: "indicacao", label: "Indicação" },
  { id: "ads", label: "Ads" },
  { id: "outro", label: "Outro" },
] as const;

export const PRODUCTS = [
  { id: "mentoria", label: "Mentoria" },
  { id: "workshop", label: "Workshop" },
  { id: "design", label: "Design" },
] as const;

export const CONTACT_TYPES = [
  { id: "lead", label: "Lead" },
  { id: "cliente", label: "Cliente" },
  { id: "ex-cliente", label: "Ex-cliente" },
] as const;

export const CONTACT_STATUSES = [
  { id: "novo", label: "Novo" },
  { id: "em-contacto", label: "Em contacto" },
  { id: "proposta", label: "Proposta enviada" },
  { id: "fechado", label: "Fechado" },
  { id: "perdido", label: "Perdido" },
] as const;

export const PAYMENT_STATUSES = [
  { id: "pago", label: "Pago" },
  { id: "pendente", label: "Pendente" },
  { id: "atrasado", label: "Atrasado" },
  { id: "reembolsado", label: "Reembolsado" },
] as const;

export const PAYMENT_METHODS = [
  { id: "mbway", label: "MBWay" },
  { id: "transferencia", label: "Transferência" },
  { id: "hotmart", label: "Hotmart" },
  { id: "cartao", label: "Cartão" },
  { id: "outro", label: "Outro" },
] as const;

export const GEOGRAPHIES = [
  { id: "portugal", label: "Portugal" },
  { id: "internacional", label: "Internacional" },
] as const;

export const SYSTEM_TAGS = [
  "mentoria",
  "workshop",
  "design",
  "hotmart",
  "lead-frio",
  "lead-quente",
  "cliente",
];

export const PLATFORMS = [
  { id: "instagram", label: "Instagram" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "email", label: "E-mail" },
  { id: "blog", label: "Blog" },
] as const;

export const POST_FORMATS = [
  { id: "reels", label: "Reels" },
  { id: "carrossel", label: "Carrossel" },
  { id: "story", label: "Story" },
  { id: "post", label: "Post estático" },
  { id: "video", label: "Vídeo" },
  { id: "artigo", label: "Artigo" },
  { id: "newsletter", label: "Newsletter" },
] as const;

export const RESEARCH_TYPES = [
  { id: "concorrencia", label: "Concorrência" },
  { id: "persona", label: "Persona" },
  { id: "tendencia", label: "Tendência" },
  { id: "inquerito", label: "Inquérito / Feedback" },
  { id: "documento", label: "Documento / Referência" },
] as const;

export const CAMPAIGN_TYPES = [
  { id: "newsletter", label: "Newsletter" },
  { id: "ads", label: "Publicidade (Ads)" },
  { id: "evento", label: "Evento / Webinar" },
  { id: "comemoracao", label: "Data especial" },
  { id: "sequencia", label: "Sequência automática" },
] as const;

export function labelOf(
  list: readonly { id: string; label: string }[],
  id: string | null | undefined
) {
  return list.find((x) => x.id === id)?.label ?? id ?? "—";
}
