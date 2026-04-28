"use client";

import { Download } from "lucide-react";
import type { ProductRollup } from "./AdminAnalyticsPanel";

const SIZE_ORDER = ["S", "M", "L", "XL"];

function escapeCsv(value: string | number | null | undefined): string {
  if (value == null) return "";
  const s = String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function productLabel(p: ProductRollup): string {
  return [p.variant_type, p.product, p.color && `(${p.color})`]
    .filter(Boolean)
    .join(" ");
}

function buildCsv(products: ProductRollup[]): string {
  const headers = [
    "מוצר",
    "סך הכל",
    ...SIZE_ORDER,
    "רשימת המתנה",
  ];
  const rows = products.map((p) => {
    const sizeMap = new Map(p.bySize.map((s) => [s.size, s.count]));
    return [
      productLabel(p),
      p.total,
      ...SIZE_ORDER.map((s) => sizeMap.get(s) ?? 0),
      p.waitlist,
    ]
      .map(escapeCsv)
      .join(",");
  });
  return "﻿" + [headers.join(","), ...rows].join("\r\n");
}

function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function ExportProductsButton({
  products,
}: {
  products: ProductRollup[];
}) {
  function onClick() {
    if (products.length === 0) return;
    const csv = buildCsv(products);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bobo-products-${todayIso()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={products.length === 0}
      className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-400"
    >
      <Download className="h-3 w-3" strokeWidth={1.75} />
      ייצוא CSV
    </button>
  );
}
