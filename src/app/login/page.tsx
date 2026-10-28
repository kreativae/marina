"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, LockKeyhole } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível entrar.");
      }

      const next = searchParams.get("next");
      router.replace(
        next?.startsWith("/") && !next.startsWith("//") ? next : "/admin"
      );
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f2f3] px-5">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl border border-ink/8 bg-white p-8 shadow-xl shadow-ink/5"
      >
        <span className="grid size-12 place-items-center rounded-2xl bg-purple text-white">
          <LockKeyhole className="size-5" />
        </span>
        <h1 className="font-display mt-5 text-2xl font-semibold">
          Acesso ao backoffice
        </h1>
        <p className="mt-1 text-sm text-ink/55">
          Introduza a senha de administrador.
        </p>
        <label className="mt-6 block text-xs font-bold uppercase tracking-wider text-ink/55">
          Senha
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-xl border border-ink/12 bg-paper px-4 py-3 text-sm"
          />
        </label>
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading || !password}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-purple disabled:opacity-50"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          Entrar
        </button>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-[#f4f2f3]">
          <Loader2 className="size-5 animate-spin text-purple" />
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
