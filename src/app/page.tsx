import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Check,
  MessageCircle,
  Quote,
  Sparkle,
  Star,
  Video,
  Wallet,
} from "lucide-react";
import Reveal from "./_components/reveal";
import LeadForm from "./_components/lead-form";
import {
  HOTMART_CHECKOUT_URL,
  WHATSAPP_MENTORIA_MSG,
  WHATSAPP_NUMBER,
} from "@/lib/constants";

const waMentoria = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  WHATSAPP_MENTORIA_MSG
)}`;

const MARQUEE_ITEMS = [
  "Identidade Visual",
  "Branding Estratégico",
  "Mentoria 1:1",
  "Workshops Online",
  "Portfólio que Vende",
  "Hotmart Creator",
  "Design com Propósito",
];

const MENTORIA_FEATURES = [
  "Sessões individuais via Zoom",
  "Plano de carreira personalizado",
  "Revisão profunda de portfólio",
  "Acompanhamento direto por WhatsApp",
];

const WORKSHOP_FEATURES = [
  "100% online e com gravação",
  "Exercícios práticos + templates",
  "Certificado de participação",
  "Acesso vitalício às atualizações",
];

const STEPS = [
  {
    n: "01",
    title: "Conversa de descoberta",
    text: "Agendamos 30 minutos para perceber o teu momento, os teus objetivos e se faz sentido trabalharmos juntas.",
  },
  {
    n: "02",
    title: "Diagnóstico",
    text: "Analiso o teu portfólio, o teu posicionamento e a forma como comunicas o teu valor enquanto designer.",
  },
  {
    n: "03",
    title: "Plano de ação",
    text: "Definimos prioridades, preços, oferta e narrativa. Sai do papel aquilo que estava só na cabeça.",
  },
  {
    n: "04",
    title: "Acompanhamento",
    text: "Sessões regulares, feedback contínuo e materiais de apoio enviados por e-mail após cada encontro.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "A mentoria mudou a forma como me posiciono. Em três meses tripliquei o valor dos meus projetos de branding.",
    name: "Ana Ribeiro",
    role: "Designer de Marca, Porto",
  },
  {
    quote:
      "O workshop é denso no melhor sentido: saí de lá com um sistema completo de identidade visual pronto a usar.",
    name: "Sofia Martins",
    role: "Aluna do Workshop, Londres",
  },
  {
    quote:
      "A Marina tem o raro dom de tornar estratégia algo simples. O meu portfólio finalmente conta a história certa.",
    name: "Tomás Almeida",
    role: "Designer Freelancer, Lisboa",
  },
];

export default function HomePage() {
  return (
    <main className="relative overflow-x-clip">
      {/* ——— NAV ——— */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-ink/8 bg-paper/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="font-display text-lg font-semibold tracking-tight">
            Marina&nbsp;Loyola<span className="text-purple">.</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-ink/70 md:flex">
            <a href="#mentoria" className="transition hover:text-purple">
              Mentoria
            </a>
            <a href="#workshop" className="transition hover:text-purple">
              Workshop
            </a>
            <a href="#sobre" className="transition hover:text-purple">
              Sobre
            </a>
            <a href="#faq" className="transition hover:text-purple">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <a
              href={waMentoria}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 text-sm font-semibold text-ink/70 transition hover:text-purple sm:inline-flex"
            >
              <MessageCircle className="size-4" />
              WhatsApp
            </a>
            <Link
              href="/agendar"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple"
            >
              Agendar sessão
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ——— HERO ——— */}
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-24">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 right-[-10%] size-[560px] rounded-full bg-purple/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-64 left-[-12%] size-[420px] rounded-full bg-grape/15 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-purple/25 bg-purple-soft px-4 py-1.5 text-xs font-bold tracking-[0.18em] text-purple uppercase">
              <Sparkle className="size-3.5" />
              Designer &amp; Mentora — Lisboa, PT
            </p>
            <h1 className="animate-fade-up delay-1 font-display mt-6 text-[13vw] leading-[0.95] font-medium tracking-tight text-balance sm:text-7xl lg:text-[5.4rem]">
              Design com{" "}
              <em className="font-light text-purple italic">identidade.</em>
              <br />
              Marcas com{" "}
              <em className="font-light text-purple italic">propósito.</em>
            </h1>
            <p className="animate-fade-up delay-2 mt-7 max-w-xl text-lg leading-relaxed text-ink/65">
              Ajudo designers e marcas a transformar talento em estratégia — e
              estratégia em resultados. Mentoria individual e workshops
              práticos, sem fórmulas mágicas.
            </p>
            <div className="animate-fade-up delay-3 mt-9 flex flex-wrap items-center gap-4">
              <a
                href={waMentoria}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 rounded-full bg-ink px-7 py-4 text-sm font-bold text-white transition hover:bg-purple"
              >
                <MessageCircle className="size-4.5" />
                Quero saber mais
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href={HOTMART_CHECKOUT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 rounded-full border-2 border-ink px-7 py-[0.9rem] text-sm font-bold text-ink transition hover:border-purple hover:text-purple"
              >
                Inscrever-me no Workshop
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
            <div className="animate-fade-up delay-4 mt-12 grid max-w-lg grid-cols-3 divide-x divide-ink/10">
              {[
                ["+120", "alunos mentorados"],
                ["8 anos", "de experiência"],
                ["4.9/5", "avaliação média"],
              ].map(([v, l]) => (
                <div key={l} className="px-4 first:pl-0">
                  <p className="font-display text-2xl font-semibold text-ink sm:text-3xl">
                    {v}
                  </p>
                  <p className="mt-1 text-xs leading-snug text-ink/50 uppercase tracking-wide">
                    {l}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-fade-up delay-3 relative mx-auto w-full max-w-md">
            <div className="absolute -inset-6 -z-10 rounded-t-full bg-purple-soft" />
            <div className="grain relative overflow-hidden rounded-t-full rounded-b-[36px] shadow-2xl shadow-purple/20">
              <Image
                src="/images/hero-art.jpg"
                alt="Arte abstrata em roxo — identidade Marina Loyola"
                width={720}
                height={900}
                priority
                className="h-auto w-full object-cover"
              />
            </div>
            <div className="animate-float-slow absolute -left-8 bottom-10 rounded-2xl border border-ink/8 bg-white/90 p-4 shadow-xl shadow-ink/10 backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-purple text-white">
                  <Video className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-bold">Sessões via Zoom</p>
                  <p className="text-xs text-ink/55">
                    Link automático + lembrete no WhatsApp
                  </p>
                </div>
              </div>
            </div>
            <div className="animate-float-slow absolute -right-4 top-14 rounded-full border border-ink/8 bg-white/90 px-4 py-2 text-xs font-bold shadow-lg backdrop-blur [animation-delay:1.2s]">
              <span className="flex items-center gap-1.5">
                <Star className="size-3.5 fill-purple text-purple" />
                4.9 · Hotmart
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ——— MARQUEE ——— */}
      <div className="relative z-10 -rotate-1 bg-ink py-4 text-white shadow-xl shadow-ink/20">
        <div className="flex w-max animate-marquee items-center gap-10 whitespace-nowrap px-5">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span
              key={i}
              className="font-display flex items-center gap-10 text-lg italic"
            >
              {item}
              <Sparkle className="size-4 text-grape" />
            </span>
          ))}
        </div>
      </div>

      {/* ——— FUNIS ——— */}
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
        <Reveal>
          <p className="text-xs font-bold tracking-[0.25em] text-purple uppercase">
            Os dois caminhos
          </p>
          <h2 className="font-display mt-4 max-w-2xl text-4xl leading-tight font-medium text-balance sm:text-5xl">
            Escolhe como queres{" "}
            <em className="text-purple italic">evoluir</em> o teu design.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {/* MENTORIA */}
          <Reveal delay={80}>
            <article
              id="mentoria"
              className="grain group relative flex h-full flex-col overflow-hidden rounded-[28px] bg-ink p-8 text-white sm:p-10"
            >
              <span className="absolute top-6 right-6 rounded-full bg-white/10 px-3 py-1 font-mono text-xs text-white/70">
                #mentoria
              </span>
              <p className="text-xs font-bold tracking-[0.25em] text-grape uppercase">
                Acompanhamento individual
              </p>
              <h3 className="font-display mt-4 text-3xl font-medium sm:text-4xl">
                Mentoria 1:1
              </h3>
              <p className="mt-4 max-w-md leading-relaxed text-white/65">
                Um programa de 4 a 12 semanas para designers que querem cobrar o
                que valem, posicionar-se e trabalhar com os clientes certos.
              </p>
              <ul className="mt-8 space-y-3.5">
                {MENTORIA_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-white/85">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-purple">
                      <Check className="size-3" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-wrap items-end justify-between gap-6 pt-10">
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-widest">
                    A partir de
                  </p>
                  <p className="font-display text-4xl font-semibold">€490</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-white/50">
                    <Wallet className="size-3.5" />
                    MBWay ou transferência · fatura via Moloni
                  </p>
                </div>
                <a
                  href={waMentoria}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/btn inline-flex items-center gap-2.5 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-ink transition hover:bg-purple hover:text-white"
                >
                  <MessageCircle className="size-4.5" />
                  Quero saber mais
                  <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-1" />
                </a>
              </div>
            </article>
          </Reveal>

          {/* WORKSHOP */}
          <Reveal delay={160}>
            <article
              id="workshop"
              className="grain group relative flex h-full flex-col overflow-hidden rounded-[28px] bg-purple text-white"
            >
              <div className="relative h-44 overflow-hidden sm:h-52">
                <Image
                  src="/images/workshop.jpg"
                  alt="Mesa de trabalho de design com pantones roxos"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute top-4 right-4 rounded-full bg-ink/80 px-3 py-1 font-mono text-xs text-white backdrop-blur">
                  #workshop
                </span>
              </div>
              <div className="flex flex-1 flex-col p-8 sm:p-10">
                <p className="text-xs font-bold tracking-[0.25em] text-white/60 uppercase">
                  Formação online · Hotmart
                </p>
                <h3 className="font-display mt-3 text-3xl font-medium sm:text-4xl">
                  Identidade Visual na Prática
                </h3>
                <p className="mt-4 max-w-md leading-relaxed text-white/75">
                  O workshop onde constróis um sistema de identidade visual do
                  zero — conceito, cor, tipografia e aplicações reais.
                </p>
                <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                  {WORKSHOP_FEATURES.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2.5 text-sm text-white/90"
                    >
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-ink">
                        <Check className="size-3" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-wrap items-end justify-between gap-6 pt-9">
                  <div>
                    <p className="text-xs text-white/60 uppercase tracking-widest">
                      Preço único
                    </p>
                    <p className="font-display text-4xl font-semibold">€47</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-white/60">
                      <BadgeCheck className="size-3.5" />
                      Checkout seguro + recibo automático Hotmart
                    </p>
                  </div>
                  <a
                    href={HOTMART_CHECKOUT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/btn inline-flex items-center gap-2.5 rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white hover:text-purple"
                  >
                    Inscrever-me agora
                    <ArrowUpRight className="size-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                  </a>
                </div>
              </div>
            </article>
          </Reveal>
        </div>
      </section>

      {/* ——— SOBRE ——— */}
      <section id="sobre" className="border-y border-ink/8 bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-24 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <div className="relative mx-auto w-full max-w-sm">
              <div className="absolute -inset-3 rounded-[36px] border-2 border-purple/30" />
              <div className="relative overflow-hidden rounded-[28px] shadow-xl shadow-purple/15">
                <Image
                  src="/images/marina.jpg"
                  alt="Marina Loyola, designer e mentora"
                  width={600}
                  height={760}
                  className="h-auto w-full object-cover"
                />
              </div>
              <div className="absolute -right-5 -bottom-5 rounded-2xl bg-ink px-5 py-4 text-white shadow-xl">
                <p className="font-display text-lg italic">«Design é clareza.»</p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <p className="text-xs font-bold tracking-[0.25em] text-purple uppercase">
              Sobre mim
            </p>
            <h2 className="font-display mt-4 text-4xl leading-tight font-medium text-balance sm:text-5xl">
              Olá, sou a <em className="text-purple italic">Marina.</em>
            </h2>
            <div className="mt-6 space-y-4 leading-relaxed text-ink/70">
              <p>
                Há oito anos que desenho marcas — e há cinco que ensino outros
                designers a fazer o mesmo com intenção. Trabalhei com estúdios
                em Lisboa e Londres até perceber que o meu trabalho favorito
                acontece do outro lado: a mentorar.
              </p>
              <p>
                Hoje divido o meu tempo entre a mentoria individual, workshops
                na Hotmart e projetos de identidade visual que me continuam a
                pôr à prova. Acredito em design honesto, preços justos e
                processos simples.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              {["Hotmart Creator", "Design Estratégico", "Identidade Visual", "Adobe Certified"].map(
                (b) => (
                  <span
                    key={b}
                    className="rounded-full border border-ink/12 bg-paper px-4 py-2 text-xs font-semibold text-ink/70"
                  >
                    {b}
                  </span>
                )
              )}
            </div>
            <Link
              href="/agendar"
              className="group mt-9 inline-flex items-center gap-2.5 rounded-full bg-purple px-7 py-4 text-sm font-bold text-white transition hover:bg-ink"
            >
              <CalendarDays className="size-4.5" />
              Agendar conversa de 30 min
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ——— PROCESSO ——— */}
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-bold tracking-[0.25em] text-purple uppercase">
                Como funciona
              </p>
              <h2 className="font-display mt-4 text-4xl leading-tight font-medium sm:text-5xl">
                Um processo <em className="text-purple italic">simples</em>, do
                início ao fim.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-ink/55">
              Do primeiro contacto no WhatsApp até aos materiais de apoio por
              e-mail — tudo orquestrado para que só tenhas de aparecer.
            </p>
          </div>
        </Reveal>
        <div className="mt-14 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 90}>
              <div className="group border-t-2 border-ink pt-6 transition hover:border-purple">
                <span className="font-display text-5xl font-light text-ink/15 transition group-hover:text-purple">
                  {s.n}
                </span>
                <h3 className="font-display mt-4 text-xl font-semibold">
                  {s.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/60">
                  {s.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ——— DEPOIMENTOS ——— */}
      <section className="border-y border-ink/8 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
          <Reveal>
            <p className="text-center text-xs font-bold tracking-[0.25em] text-purple uppercase">
              Depoimentos
            </p>
            <h2 className="font-display mx-auto mt-4 max-w-2xl text-center text-4xl leading-tight font-medium text-balance sm:text-5xl">
              Palavras de quem já{" "}
              <em className="text-purple italic">passou por aqui.</em>
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 100}>
                <figure className="flex h-full flex-col rounded-3xl border border-ink/8 bg-paper p-8 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-purple/10">
                  <Quote className="size-7 text-purple" />
                  <blockquote className="font-display mt-5 flex-1 text-lg leading-relaxed">
                    {t.quote}
                  </blockquote>
                  <figcaption className="mt-7 flex items-center gap-3 border-t border-ink/8 pt-5">
                    <span className="grid size-10 place-items-center rounded-full bg-purple text-sm font-bold text-white">
                      {t.name[0]}
                    </span>
                    <div>
                      <p className="text-sm font-bold">{t.name}</p>
                      <p className="text-xs text-ink/55">{t.role}</p>
                    </div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ——— LEAD MAGNET ——— */}
      <section className="relative overflow-hidden bg-purple">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-ink/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-white/10 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2">
          <Reveal>
            <p className="text-xs font-bold tracking-[0.25em] text-white/60 uppercase">
              Guia gratuito
            </p>
            <h2 className="font-display mt-4 text-4xl leading-tight font-medium text-balance text-white sm:text-5xl">
              Os 7 erros de identidade visual que estão a{" "}
              <em className="italic">custar-te clientes.</em>
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-white/75">
              Um PDF direto ao ponto, com checklists e exemplos reais. Grátis,
              sem letra pequena — e ficas a receber a minha newsletter quinzenal.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <LeadForm />
          </Reveal>
        </div>
      </section>

      {/* ——— FAQ ——— */}
      <section id="faq" className="mx-auto max-w-4xl px-5 py-24 sm:px-8 sm:py-32">
        <Reveal>
          <h2 className="font-display text-center text-4xl leading-tight font-medium sm:text-5xl">
            Perguntas <em className="text-purple italic">frequentes.</em>
          </h2>
        </Reveal>
        <div className="mt-12 divide-y divide-ink/10 border-y border-ink/10">
          {[
            [
              "Como funcionam os pagamentos da Mentoria?",
              "Em Portugal, por MBWay ou transferência bancária — recebes os dados no WhatsApp e a fatura segue por e-mail (emitida no Moloni). Clientes internacionais pagam via Hotmart, com cartão ou PayPal.",
            ],
            [
              "As sessões são ao vivo?",
              "Sim, todas via Zoom. Ao agendar, recebes automaticamente o link por e-mail e um reforço por WhatsApp antes da sessão.",
            ],
            [
              "O workshop tem prazo para ver?",
              "Não. A gravação e os materiais são teus para sempre, incluindo todas as atualizações futuras do conteúdo.",
            ],
            [
              "Posso reembolsar o workshop?",
              "Sim — a Hotmart garante 7 dias de reembolso incondicional, sem perguntas.",
            ],
          ].map(([q, a], i) => (
            <Reveal key={q} delay={i * 60}>
              <details className="group py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-semibold transition group-open:text-purple [&::-webkit-details-marker]:hidden">
                  {q}
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border border-ink/15 text-ink/60 transition group-open:rotate-45 group-open:border-purple group-open:text-purple">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/60">
                  {a}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ——— FOOTER ——— */}
      <footer className="grain bg-ink text-white">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-bold tracking-[0.25em] text-grape uppercase">
                Vamos conversar?
              </p>
              <p className="font-display mt-4 text-5xl leading-[1.05] font-medium sm:text-7xl">
                A tua marca merece
                <br />
                <em className="text-grape italic">uma identidade.</em>
              </p>
            </div>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                "Olá Marina! Vim do teu site e gostava de conversar."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 rounded-full bg-white px-8 py-5 text-sm font-bold text-ink transition hover:bg-purple hover:text-white"
            >
              <MessageCircle className="size-5" />
              Falar no WhatsApp
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
          <div className="mt-16 flex flex-wrap items-center justify-between gap-6 border-t border-white/10 pt-8 text-sm text-white/50">
            <p className="font-display text-lg font-semibold text-white">
              Marina Loyola<span className="text-grape">.</span>
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <a href="mailto:ola@marinaloyola.com" className="transition hover:text-white">
                ola@marinaloyola.com
              </a>
              <a href="#mentoria" className="transition hover:text-white">
                Mentoria
              </a>
              <a href="#workshop" className="transition hover:text-white">
                Workshop
              </a>
              <Link href="/agendar" className="transition hover:text-white">
                Agendar
              </Link>
              <Link href="/admin" className="transition hover:text-white">
                Backoffice
              </Link>
            </div>
            <p>© 2025 Marina Loyola — Lisboa, Portugal</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
