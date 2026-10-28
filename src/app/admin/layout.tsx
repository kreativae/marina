import type { Metadata } from "next";
import type { ReactNode } from "react";
import AdminShell from "./_components/shell";

export const metadata: Metadata = {
  title: "Backoffice — Marina Loyola",
  description: "Sistema de gestão comercial e de marketing.",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
