"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  CalendarDays,
  CalendarRange,
  Camera,
  Columns3,
  ExternalLink,
  LayoutDashboard,
  Mail,
  Megaphone,
  Menu,
  LogOut,
  Plug,
  Search,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  {
    section: "Comercial",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/crm", label: "Contactos & CRM", icon: Users },
      { href: "/admin/pipeline", label: "Pipeline de Vendas", icon: Columns3 },
      { href: "/admin/agenda", label: "Agenda & Zoom", icon: CalendarDays },
    ],
  },
  {
    section: "Marketing",
    items: [
      { href: "/admin/marketing", label: "Pipeline de Marketing", icon: Megaphone },
      {
        href: "/admin/marketing/calendario",
        label: "Calendário Editorial",
        icon: CalendarRange,
      },
      {
        href: "/admin/marketing/instagram",
        label: "Esteira Instagram",
        icon: Camera,
      },
      { href: "/admin/marketing/pesquisa", label: "Pesquisa de Mercado", icon: Search },
      { href: "/admin/remarketing", label: "Re-marketing", icon: Mail },
    ],
  },
  {
    section: "Sistema",
    items: [{ href: "/admin/integracoes", label: "Integrações", icon: Plug }],
  },
];

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col bg-ink text-white">
      <Link
        href="/admin"
        onClick={onNavigate}
        className="flex items-center gap-3 border-b border-white/10 px-6 py-5"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-purple font-display text-sm font-bold">
          ML
        </span>
        <div className="leading-tight">
          <p className="font-display text-sm font-semibold">Marina Loyola</p>
          <p className="text-[11px] text-white/45">Backoffice · v2.0</p>
        </div>
      </Link>
      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
        {NAV.map((group) => (
          <div key={group.section}>
            <p className="px-2 text-[10px] font-bold tracking-[0.22em] text-white/35 uppercase">
              {group.section}
            </p>
            <ul className="mt-2 space-y-1">
              {group.items.map((item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                        active
                          ? "bg-purple text-white shadow-lg shadow-purple/30"
                          : "text-white/60 hover:bg-white/8 hover:text-white"
                      )}
                    >
                      <Icon className="size-4.5 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <Link
          href="/"
          className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          Ver site público
          <ExternalLink className="size-4" />
        </Link>
      </div>
    </div>
  );
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const today = new Date().toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#f4f2f3]">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <Sidebar />
      </aside>

      {/* Sidebar mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 shadow-2xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 z-10 grid size-9 place-items-center rounded-full bg-white/10 text-white"
              aria-label="Fechar menu"
            >
              <X className="size-4" />
            </button>
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-ink/8 bg-[#f4f2f3]/85 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="grid size-10 place-items-center rounded-xl border border-ink/10 bg-white lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="size-5" />
            </button>
            <p className="text-sm font-semibold text-ink/60 capitalize">{today}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-purple-soft px-3.5 py-1.5 text-xs font-bold text-purple sm:block">
              Preto · Branco · #800080
            </span>
            <button
              type="button"
              onClick={logout}
              title="Terminar sessão"
              aria-label="Terminar sessão"
              className="group relative grid size-10 place-items-center rounded-full bg-ink text-sm font-bold text-white"
            >
              <span className="group-hover:hidden">ML</span>
              <LogOut className="hidden size-4 group-hover:block" />
            </button>
          </div>
        </header>
        <main className="p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
