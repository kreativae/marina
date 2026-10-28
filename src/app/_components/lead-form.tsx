"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

export default function LeadForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState("mentoria");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("loading");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, interest }),
      });
      if (!res.ok) throw new Error();
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-5 text-white ring-1 ring-white/25">
        <CheckCircle2 className="size-6 shrink-0 text-white" />
        <div>
          <p className="font-semibold">Está feito! Verifica o teu e-mail.</p>
          <p className="text-sm text-white/70">
            O guia vai a caminho. Entraste também na lista da newsletter.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="O teu nome"
          className="rounded-xl border border-white/25 bg-white/10 px-4 py-3.5 text-sm text-white placeholder:text-white/50"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="O teu melhor e-mail"
          className="rounded-xl border border-white/25 bg-white/10 px-4 py-3.5 text-sm text-white placeholder:text-white/50"
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <select
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          className="rounded-xl border border-white/25 bg-white/10 px-4 py-3.5 text-sm text-white sm:w-56 [&>option]:text-ink"
        >
          <option value="mentoria">Interesse: Mentoria</option>
          <option value="workshop">Interesse: Workshop</option>
          <option value="design">Interesse: Design</option>
        </select>
        <button
          type="submit"
          disabled={state === "loading"}
          className="group inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-purple transition hover:bg-purple-soft disabled:opacity-60"
        >
          {state === "loading" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              Quero o guia gratuito
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </div>
      {state === "error" && (
        <p className="text-sm text-white/80">
          Algo correu mal. Tenta novamente.
        </p>
      )}
      <p className="text-xs text-white/50">
        Sem spam. Só conteúdo de design, uma a duas vezes por mês.
      </p>
    </form>
  );
}
