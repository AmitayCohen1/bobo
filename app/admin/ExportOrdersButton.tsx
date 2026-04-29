"use client";

import { Download } from "lucide-react";
import type { Order } from "@/lib/db";

const dateFmt = new Intl.DateTimeFormat("he-IL", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Asia/Jerusalem",
});

function productLabel(o: Order): string {
  return [o.variant_type, o.product, o.color && `(${o.color})`]
    .filter(Boolean)
    .join(" ");
}

function escapeCsv(value: string | null | undefined): string {
  if (value == null) return "";
  const s = String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildCsv(orders: Order[]): string {
  const headers = [
    "תאריך",
    "סוג",
    "מוצר",
    "מידה",
    "כמות",
    "לקוח",
    "טלפון",
    "הערות",
    "הערה לעצמי",
    "מאיפה הגעת",
    "סטטוס",
    "שולם",
  ];
  const rows = orders.map((o) =>
    [
      dateFmt.format(new Date(o.created_at)),
      o.is_waitlist ? "רשימת המתנה" : "הזמנה",
      productLabel(o),
      o.size,
      String(o.quantity ?? 1),
      o.customer_name,
      o.phone,
      o.notes,
      o.admin_note,
      o.heard_from,
      o.status,
      o.is_paid ? "כן" : "לא",
    ]
      .map(escapeCsv)
      .join(",")
  );
  return "﻿" + [headers.join(","), ...rows].join("\r\n");
}

function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function ExportOrdersButton({ orders }: { orders: Order[] }) {
  function onClick() {
    if (orders.length === 0) return;
    const csv = buildCsv(orders);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bobo-orders-${todayIso()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={orders.length === 0}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500 sm:w-auto"
    >
      <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
      ייצוא CSV
    </button>
  );
}
