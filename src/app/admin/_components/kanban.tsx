"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type KanbanColumn = { id: string; label: string };

export type KanbanItem = { id: number; stage: string };

export default function KanbanBoard<T extends KanbanItem>({
  columns,
  items,
  onMove,
  renderCard,
  columnFooter,
  accentDot,
}: {
  columns: readonly KanbanColumn[];
  items: T[];
  onMove: (id: number, stage: string) => void;
  renderCard: (item: T) => ReactNode;
  columnFooter?: (items: T[]) => ReactNode;
  accentDot?: (stage: string, index: number) => string;
}) {
  const [dragId, setDragId] = useState<number | null>(null);
  const [over, setOver] = useState<string | null>(null);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col, i) => {
        const colItems = items.filter((it) => it.stage === col.id);
        return (
          <div
            key={col.id}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(col.id);
            }}
            onDragLeave={() => setOver((o) => (o === col.id ? null : o))}
            onDrop={(e) => {
              e.preventDefault();
              const id = Number(e.dataTransfer.getData("text/plain") || dragId);
              if (id) onMove(id, col.id);
              setDragId(null);
              setOver(null);
            }}
            className={cn(
              "flex w-72 shrink-0 flex-col rounded-2xl border transition",
              over === col.id
                ? "border-purple bg-purple-soft/60"
                : "border-ink/8 bg-[#edeaeb]"
            )}
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <p className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-ink/60 uppercase">
                <span
                  className="size-2 rounded-full"
                  style={{
                    backgroundColor: accentDot
                      ? accentDot(col.id, i)
                      : "#800080",
                  }}
                />
                {col.label}
              </p>
              <span className="grid size-6 place-items-center rounded-full bg-white text-[11px] font-bold text-ink/60 ring-1 ring-ink/10">
                {colItems.length}
              </span>
            </div>
            <div className="flex min-h-24 flex-1 flex-col gap-2.5 px-3 py-2">
              {colItems.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => {
                    setDragId(item.id);
                    e.dataTransfer.setData("text/plain", String(item.id));
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setOver(null);
                  }}
                  className={cn(
                    "cursor-grab transition active:cursor-grabbing",
                    dragId === item.id && "opacity-40"
                  )}
                >
                  {renderCard(item)}
                </div>
              ))}
              {colItems.length === 0 && (
                <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-ink/12 py-6 text-xs font-medium text-ink/35">
                  Arrasta para aqui
                </div>
              )}
            </div>
            {columnFooter && (
              <div className="border-t border-ink/8 px-4 py-3 text-xs text-ink/55">
                {columnFooter(colItems)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
