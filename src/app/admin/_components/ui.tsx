"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 text-sm text-ink/55">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-ink/8 bg-white shadow-sm shadow-ink/4",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Btn({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "purple" | "ghost" | "danger";
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-ink text-white hover:bg-purple",
        variant === "purple" && "bg-purple text-white hover:bg-ink",
        variant === "ghost" &&
          "border border-ink/12 bg-white text-ink hover:border-purple hover:text-purple",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        className
      )}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "purple" | "dark" | "green" | "amber" | "red" | "outline";
}) {
  const tones = {
    neutral: "bg-ink/6 text-ink/70",
    purple: "bg-purple-soft text-purple",
    dark: "bg-ink text-white",
    green: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-700",
    outline: "border border-ink/15 text-ink/60",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

export function Lbl({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-[11px] font-bold tracking-wider text-ink/50 uppercase">
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-ink/12 bg-white px-3.5 py-2.5 text-sm transition";

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div
        className="animate-fade-in absolute inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "animate-fade-up relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl sm:p-8",
          wide ? "sm:max-w-2xl" : "sm:max-w-lg"
        )}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full border border-ink/10 text-ink/60 transition hover:border-purple hover:text-purple"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  accent?: boolean;
}) {
  return (
    <Card
      className={cn(
        "p-5",
        accent && "border-purple/25 bg-gradient-to-br from-purple-soft to-white"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-wider text-ink/50 uppercase">
            {label}
          </p>
          <p className="font-display mt-2 text-3xl font-semibold tracking-tight">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-ink/50">{hint}</p>}
        </div>
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl",
            accent ? "bg-purple text-white" : "bg-ink text-white"
          )}
        >
          {icon}
        </span>
      </div>
    </Card>
  );
}

export function EmptyState({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink/15 bg-white/60 px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-purple-soft text-purple">
        {icon}
      </span>
      <p className="mt-4 font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-xs text-sm text-ink/50">{text}</p>}
    </div>
  );
}
