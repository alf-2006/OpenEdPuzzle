"use client";

import { motion } from "framer-motion";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { getStableColor, hexToRgb } from "@/lib/design-utils";

interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

interface AnalyticsTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
}

export function AnalyticsTable<T extends { id: string }>({
  columns,
  data,
  onRowClick,
}: AnalyticsTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0;

    const aVal = a[sortKey];
    const bVal = b[sortKey];

    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    }

    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortDirection === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    return 0;
  });

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-full inline-block align-middle">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 dark:bg-slate-950/60 backdrop-blur-xl">
          {/* Header */}
          <div className="border-b border-white/10 bg-white/5 dark:bg-slate-950/40">
            <div className="grid" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
              {columns.map((column, idx) => (
                <button
                  key={String(column.key)}
                  onClick={() => column.sortable && handleSort(column.key)}
                  disabled={!column.sortable}
                  className={cn(
                    "px-6 py-4 text-left text-sm font-semibold transition-colors",
                    column.sortable &&
                      "cursor-pointer hover:bg-white/5 dark:hover:bg-slate-950/60",
                    !column.sortable && "cursor-default"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <motion.div
                        animate={{
                          rotate:
                            sortKey === column.key
                              ? sortDirection === "asc"
                                ? 180
                                : 0
                              : 0,
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        {sortKey === column.key ? (
                          <ArrowUp className="w-4 h-4" />
                        ) : (
                          <ArrowUpDown className="w-4 h-4 opacity-50" />
                        )}
                      </motion.div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="divide-y divide-white/5">
            {sortedData.map((row, rowIdx) => {
              const accentColor = getStableColor(row.id);
              const accentRgb = hexToRgb(accentColor);

              return (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: rowIdx * 0.05, duration: 0.3 }}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "grid transition-all duration-200 cursor-pointer relative group",
                    "hover:bg-white/5 dark:hover:bg-slate-950/60"
                  )}
                  style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}
                >
                  {/* Left accent bar - shows on hover */}
                  <motion.div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
                    style={{ backgroundColor: accentColor }}
                    initial={{ scaleY: 0 }}
                    whileHover={{ scaleY: 1 }}
                    transition={{ duration: 0.2 }}
                  />

                  {columns.map((column) => (
                    <div
                      key={String(column.key)}
                      className="px-6 py-4 text-sm"
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : String(row[column.key])}
                    </div>
                  ))}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Glass badge component for status indicators
export function GlassBadge({
  children,
  variant = "default",
  glow = false,
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
  glow?: boolean;
}) {
  const colors = {
    default: { bg: "rgba(59, 130, 246, 0.1)", border: "rgba(59, 130, 246, 0.3)", text: "rgb(96, 165, 250)", glow: "rgba(59, 130, 246, 0.3)" },
    success: { bg: "rgba(34, 197, 94, 0.1)", border: "rgba(34, 197, 94, 0.3)", text: "rgb(74, 222, 128)", glow: "rgba(34, 197, 94, 0.3)" },
    warning: { bg: "rgba(245, 158, 11, 0.1)", border: "rgba(245, 158, 11, 0.3)", text: "rgb(251, 191, 36)", glow: "rgba(245, 158, 11, 0.3)" },
    danger: { bg: "rgba(239, 68, 68, 0.1)", border: "rgba(239, 68, 68, 0.3)", text: "rgb(248, 113, 113)", glow: "rgba(239, 68, 68, 0.3)" },
  };

  const style = colors[variant];

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold backdrop-blur-sm"
      style={{
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        color: style.text,
        boxShadow: glow ? `0 0 12px ${style.glow}` : undefined,
      }}
    >
      {children}
    </span>
  );
}

// Animated progress bar for analytics
export function AnimatedProgress({
  value,
  max = 100,
  color,
  showLabel = true,
}: {
  value: number;
  max?: number;
  color?: string;
  showLabel?: boolean;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  const accentColor = color || getStableColor(value.toString());
  const accentRgb = hexToRgb(accentColor);

  return (
    <div className="space-y-1">
      <div className="relative h-2 rounded-full bg-white/5 dark:bg-slate-950/60 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${accentColor}, rgba(${accentRgb}, 0.7))`,
            boxShadow: `0 0 8px rgba(${accentRgb}, 0.5)`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      {showLabel && (
        <div className="text-xs text-muted-foreground">
          {value} / {max}
        </div>
      )}
    </div>
  );
}
