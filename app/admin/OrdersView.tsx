"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Box,
  CheckCircle2,
  Clock,
  Copy,
  Hash,
  Inbox,
  Megaphone,
  NotebookPen,
  Package,
  Phone,
  Ruler,
  Search,
  StickyNote,
  User,
} from "lucide-react";
import type { Order } from "@/lib/db";
import { updateOrderAdminNote } from "@/app/actions/orders";
import { imagePathFor } from "@/lib/product-image";
import { DeleteOrderButton } from "./DeleteOrderButton";
import { AdminNoteEditor } from "./AdminNoteEditor";
import { OrderSizeEditor } from "./OrderSizeEditor";
import { OrderQuantityEditor } from "./OrderQuantityEditor";
import { HeardFromEditor } from "./HeardFromEditor";
import { PaidToggle } from "./PaidToggle";
import { PackedToggle } from "./PackedToggle";
import { CollectedToggle } from "./CollectedToggle";

type TriState = "any" | "yes" | "no";
type SortMode = "date" | "open";

function nextTri(s: TriState): TriState {
  return s === "any" ? "yes" : s === "yes" ? "no" : "any";
}

function triLabel(s: TriState, yes: string, no: string): string {
  return s === "yes" ? yes : s === "no" ? no : "";
}

function openScore(o: Order): number {
  if (!o.is_paid) return 0;
  if (!o.is_packed) return 1;
  if (!o.is_collected) return 2;
  return 3;
}

const dateFmt = new Intl.DateTimeFormat("he-IL", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jerusalem",
});

const dayFmt = new Intl.DateTimeFormat("he-IL", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Jerusalem",
});

const timeFmt = new Intl.DateTimeFormat("he-IL", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jerusalem",
});

function productLabel(o: Order) {
  return [o.variant_type, o.product, o.color && `(${o.color})`]
    .filter(Boolean)
    .join(" ");
}

function imageFor(o: { product: string; variant_type: string | null; color: string | null }) {
  return imagePathFor({
    product: o.product,
    variantType: o.variant_type,
    color: o.color,
  });
}

function whatsappLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("0") ? "972" + digits.slice(1) : digits;
  return `https://wa.me/${intl}`;
}

function dupeKey(o: Order): string {
  return [
    o.phone.replace(/\D/g, ""),
    o.product,
    o.variant_type ?? "",
    o.color ?? "",
    o.size,
  ].join("|");
}

function productKey(o: {
  product: string;
  variant_type: string | null;
  color: string | null;
}): string {
  return `${o.product}|${o.variant_type ?? ""}|${o.color ?? ""}`;
}

function shortProductLabel(o: {
  product: string;
  variant_type: string | null;
  color: string | null;
}): string {
  const stripped = o.product.replace(/^חולצת\s+/, "").replace(/^חולצה\s+/, "");
  return [o.variant_type, stripped, o.color].filter(Boolean).join(" · ");
}

const SIZE_ORDER = ["12", "14", "16", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];

export function OrdersView({ orders }: { orders: Order[] }) {
  const [query, setQuery] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    () => new Set()
  );
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(
    () => new Set()
  );
  const [paidFilter, setPaidFilter] = useState<TriState>("any");
  const [packedFilter, setPackedFilter] = useState<TriState>("any");
  const [collectedFilter, setCollectedFilter] = useState<TriState>("any");
  const [sortMode, setSortMode] = useState<SortMode>("date");

  const dupeMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of orders) {
      const k = dupeKey(o);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [orders]);

  const productOptions = useMemo(() => {
    const map = new Map<
      string,
        {
          key: string;
          label: string;
          image: string;
          count: number;
        }
    >();
    for (const o of orders) {
      const key = productKey(o);
      let g = map.get(key);
      if (!g) {
        g = { key, label: shortProductLabel(o), image: imageFor(o), count: 0 };
        map.set(key, g);
      }
      g.count += 1;
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [orders]);

  const sizeOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const o of orders) {
      counts.set(o.size, (counts.get(o.size) ?? 0) + 1);
    }
    return SIZE_ORDER.map((s) => ({
      size: s,
      count: counts.get(s) ?? 0,
    }));
  }, [orders]);

  const filtered = useMemo(() => {
    let result = orders;
    if (selectedProducts.size > 0) {
      result = result.filter((o) => selectedProducts.has(productKey(o)));
    }
    if (selectedSizes.size > 0) {
      result = result.filter((o) => selectedSizes.has(o.size));
    }
    if (paidFilter !== "any") {
      result = result.filter((o) => o.is_paid === (paidFilter === "yes"));
    }
    if (packedFilter !== "any") {
      result = result.filter((o) => o.is_packed === (packedFilter === "yes"));
    }
    if (collectedFilter !== "any") {
      result = result.filter(
        (o) => o.is_collected === (collectedFilter === "yes")
      );
    }
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((o) => {
        const haystack = [
          o.customer_name,
          o.phone,
          o.product,
          o.variant_type,
          o.color,
          o.size,
          o.notes,
          o.admin_note,
          o.heard_from,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }
    if (sortMode === "open") {
      result = [...result].sort((a, b) => {
        const sa = openScore(a);
        const sb = openScore(b);
        if (sa !== sb) return sa - sb;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }
    return result;
  }, [
    orders,
    query,
    selectedProducts,
    selectedSizes,
    paidFilter,
    packedFilter,
    collectedFilter,
    sortMode,
  ]);

  const totalUnits = useMemo(
    () => orders.reduce((acc, o) => acc + (o.quantity ?? 1), 0),
    [orders]
  );
  const filteredUnits = useMemo(
    () => filtered.reduce((acc, o) => acc + (o.quantity ?? 1), 0),
    [filtered]
  );

  function toggleProduct(key: string) {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleSize(s: string) {
    setSelectedSizes((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  function clearFilters() {
    setQuery("");
    setSelectedProducts(new Set());
    setSelectedSizes(new Set());
    setPaidFilter("any");
    setPackedFilter("any");
    setCollectedFilter("any");
  }

  const hasActiveFilters =
    query.trim().length > 0 ||
    selectedProducts.size > 0 ||
    selectedSizes.size > 0 ||
    paidFilter !== "any" ||
    packedFilter !== "any" ||
    collectedFilter !== "any";

  if (orders.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <Inbox className="h-8 w-8 text-neutral-400" strokeWidth={1.5} />
        <p className="mt-3 text-sm font-medium text-neutral-600">
          אין הזמנות עדיין
        </p>
      </div>
    );
  }

  return (
    <section className="mt-4 rounded-3xl border border-neutral-200 bg-white/90 p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] backdrop-blur md:p-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5 border-b border-neutral-100 pb-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
              סינון רשימה
            </p>
            <h2 className="mt-1 text-base font-semibold tracking-[-0.02em] text-neutral-950">
              חיפוש, מוצר ומידה
            </h2>
            <p className="mt-1 text-xs text-neutral-600">
              כל מה שמופיע כאן משפיע רק על הטבלה שמתחת.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-100 bg-neutral-50/70 p-3">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                strokeWidth={1.75}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="חיפוש לפי שם, טלפון, מוצר, הערה או מקור"
                className="h-10 w-full rounded-2xl border border-neutral-200 bg-white pr-10 pl-4 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-neutral-600">
                {filtered.length === orders.length
                  ? `${orders.length} הזמנות · ${totalUnits} יחידות`
                  : `${filtered.length} מתוך ${orders.length} הזמנות · ${filteredUnits} מתוך ${totalUnits} יחידות`}
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-medium text-neutral-600 underline-offset-4 hover:text-neutral-900 hover:underline"
                >
                  נקה את כל הסינון
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              {productOptions.length > 1 && (
                <ChipRow label="מוצר">
                  {productOptions.map((p) => (
                    <Chip
                      key={p.key}
                      active={selectedProducts.has(p.key)}
                      onClick={() => toggleProduct(p.key)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.image}
                        alt=""
                        className="h-5 w-5 shrink-0 object-contain"
                      />
                      <span>{p.label}</span>
                      <span
                        className={`text-[10px] tabular-nums ${
                          selectedProducts.has(p.key)
                            ? "text-white/70"
                            : "text-neutral-400"
                        }`}
                      >
                        {p.count}
                      </span>
                    </Chip>
                  ))}
                </ChipRow>
              )}
              <ChipRow label="מידה">
                {sizeOptions.map((s) => (
                  <Chip
                    key={s.size}
                    active={selectedSizes.has(s.size)}
                    disabled={s.count === 0}
                    onClick={() => toggleSize(s.size)}
                  >
                    <span>{s.size}</span>
                    <span
                      className={`text-[10px] tabular-nums ${
                        selectedSizes.has(s.size)
                          ? "text-white/70"
                          : "text-neutral-400"
                      }`}
                    >
                      {s.count}
                    </span>
                  </Chip>
                ))}
              </ChipRow>
              <ChipRow label="סטטוס">
                <TriChip
                  state={paidFilter}
                  onClick={() => setPaidFilter(nextTri(paidFilter))}
                  emoji="💰"
                  base="תשלום"
                  yesLabel="שולם"
                  noLabel="לא שולם"
                />
                <TriChip
                  state={packedFilter}
                  onClick={() => setPackedFilter(nextTri(packedFilter))}
                  emoji="📦"
                  base="אריזה"
                  yesLabel="ארוז"
                  noLabel="לא ארוז"
                />
                <TriChip
                  state={collectedFilter}
                  onClick={() =>
                    setCollectedFilter(nextTri(collectedFilter))
                  }
                  emoji="✅"
                  base="איסוף"
                  yesLabel="נאסף"
                  noLabel="לא נאסף"
                />
              </ChipRow>
              <ChipRow label="מיון">
                <Chip
                  active={sortMode === "date"}
                  onClick={() => setSortMode("date")}
                >
                  <span>חדש ביותר</span>
                </Chip>
                <Chip
                  active={sortMode === "open"}
                  onClick={() => setSortMode("open")}
                >
                  <span>פתוחים תחילה</span>
                </Chip>
              </ChipRow>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
            <p className="text-sm font-medium text-neutral-600">
              אין תוצאות לחיפוש
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              נסה להסיר מסנן, לשנות מידה או לחפש מונח אחר.
            </p>
          </div>
        ) : (
          <ChronoView orders={filtered} dupeMap={dupeMap} />
        )}
      </div>
    </section>
  );
}

function ChipRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="ml-1 text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </span>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  disabled = false,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const base =
    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors";
  const cls = disabled
    ? `${base} cursor-not-allowed border-neutral-200 bg-white text-neutral-300`
    : active
      ? `${base} cursor-pointer border-neutral-900 bg-neutral-900 text-white`
      : `${base} cursor-pointer border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50`;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cls}
    >
      {children}
    </button>
  );
}

function TriChip({
  state,
  onClick,
  emoji,
  base,
  yesLabel,
  noLabel,
}: {
  state: TriState;
  onClick: () => void;
  emoji: string;
  base: string;
  yesLabel: string;
  noLabel: string;
}) {
  const baseCls =
    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer";
  const cls =
    state === "yes"
      ? `${baseCls} border-emerald-500 bg-emerald-500 text-white`
      : state === "no"
        ? `${baseCls} border-rose-500 bg-rose-500 text-white`
        : `${baseCls} border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50`;
  const label =
    state === "yes" ? yesLabel : state === "no" ? noLabel : base;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cls}
      title={triLabel(state, yesLabel, noLabel) || base}
    >
      <span aria-hidden="true">{emoji}</span>
      <span>{label}</span>
    </button>
  );
}

function WaButton({ phone }: { phone: string }) {
  return (
    <a
      href={whatsappLink(phone)}
      target="_blank"
      rel="noreferrer"
      title="שליחת הודעה בוואטסאפ"
      aria-label="WhatsApp"
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white transition-transform hover:scale-110"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
      </svg>
    </a>
  );
}

function PhoneCell({ phone }: { phone: string }) {
  return (
    <div className="inline-flex items-center gap-2" dir="ltr">
      <a
        href={`tel:${phone}`}
        className="inline-flex items-center gap-1.5 text-neutral-700 hover:text-neutral-900"
      >
        <Phone className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.75} />
        <span>{phone}</span>
      </a>
      <WaButton phone={phone} />
    </div>
  );
}

function Th({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  children: React.ReactNode;
}) {
  return (
    <th className="px-4 py-3 font-medium">
      <span className="inline-flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.75} />
        <span>{children}</span>
      </span>
    </th>
  );
}

function DupeBadge({ count }: { count: number }) {
  if (count <= 1) return null;
  return (
    <span
      title="הזמנה זהה מאותו מספר"
      className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700"
    >
      <Copy className="h-2.5 w-2.5" strokeWidth={2} />
      כפול ×{count}
    </span>
  );
}

function WaitlistBadge({ on }: { on: boolean }) {
  if (!on) return null;
  return (
    <span
      title="רישום לרשימת המתנה"
      className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700"
    >
      המתנה
    </span>
  );
}

function ChronoView({
  orders,
  dupeMap,
}: {
  orders: Order[];
  dupeMap: Map<string, number>;
}) {
  return (
    <>
      {/* Mobile cards */}
      <ul className="mt-4 flex flex-col gap-3 md:hidden">
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} dupeCount={dupeMap.get(dupeKey(o)) ?? 1} />
        ))}
      </ul>

      {/* Desktop table */}
      <div className="mt-4 hidden overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)] md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-neutral-50/80 text-[11px] uppercase tracking-[0.14em] text-neutral-500">
              <tr>
                <Th icon={Clock}>תאריך</Th>
                <Th icon={Package}>מוצר</Th>
                <Th icon={Ruler}>מידה</Th>
                <Th icon={Hash}>כמות</Th>
                <Th icon={User}>לקוח</Th>
                <Th icon={Phone}>טלפון</Th>
                <Th icon={Megaphone}>מקור</Th>
                <Th icon={BadgeCheck}>תשלום</Th>
                <Th icon={Box}>אריזה</Th>
                <Th icon={CheckCircle2}>איסוף</Th>
                <Th icon={StickyNote}>הערות</Th>
                <Th icon={NotebookPen}>הערה לעצמי</Th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <OrderRow
                  key={o.id}
                  order={o}
                  dupeCount={dupeMap.get(dupeKey(o)) ?? 1}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function OrderRow({ order: o, dupeCount }: { order: Order; dupeCount: number }) {
  return (
    <tr className="border-t border-neutral-100 align-top transition-colors hover:bg-neutral-50/70">
      <td className="whitespace-nowrap px-2 py-3 text-[11px] leading-tight text-neutral-500">
        <div className="flex flex-col tabular-nums">
          <span>{dayFmt.format(new Date(o.created_at))}</span>
          <span className="text-neutral-400">
            {timeFmt.format(new Date(o.created_at))}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-neutral-900">
        <div className="flex items-start gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageFor(o)}
            alt=""
            className="h-10 w-10 shrink-0 object-contain"
          />
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-medium">{productLabel(o)}</span>
              <WaitlistBadge on={o.is_waitlist} />
            </div>
            <DupeBadge count={dupeCount} />
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-neutral-900">
        <OrderSizeEditor id={o.id} current={o.size} />
      </td>
      <td className="px-4 py-3 text-neutral-900">
        <OrderQuantityEditor id={o.id} current={o.quantity} />
      </td>
      <td className="px-4 py-3 text-neutral-900">{o.customer_name}</td>
      <td className="px-4 py-3 text-neutral-900">
        <PhoneCell phone={o.phone} />
      </td>
      <td className="px-4 py-3 text-neutral-900">
        <HeardFromEditor id={o.id} initial={o.heard_from} />
      </td>
      <td className="px-4 py-3 text-neutral-900">
        <PaidToggle id={o.id} initial={o.is_paid} />
      </td>
      <td className="px-4 py-3 text-neutral-900">
        <PackedToggle id={o.id} initial={o.is_packed} />
      </td>
      <td className="px-4 py-3 text-neutral-900">
        <CollectedToggle id={o.id} initial={o.is_collected} />
      </td>
      <td className="max-w-xs whitespace-pre-wrap px-4 py-3 text-neutral-700">
        {o.notes ? (
          <span className="inline-flex items-start gap-1.5">
            <StickyNote
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400"
              strokeWidth={1.75}
            />
            <span>{o.notes}</span>
          </span>
        ) : (
          <span className="text-neutral-300">—</span>
        )}
      </td>
      <td className="max-w-xs px-4 py-3 align-top">
        <AdminNoteEditor
          id={o.id}
          initialNote={o.admin_note}
          action={updateOrderAdminNote}
        />
      </td>
      <td className="px-2 py-3 text-left">
        <DeleteOrderButton id={o.id} label={o.customer_name} />
      </td>
    </tr>
  );
}

function OrderCard({
  order: o,
  dupeCount,
}: {
  order: Order;
  dupeCount: number;
}) {
  return (
    <li className="rounded border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageFor(o)}
            alt=""
            className="h-12 w-12 shrink-0 object-contain"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-neutral-500">
                {dateFmt.format(new Date(o.created_at))}
              </span>
              <WaitlistBadge on={o.is_waitlist} />
              <DupeBadge count={dupeCount} />
            </div>
            <p className="mt-1 text-sm font-medium text-neutral-900">
              {productLabel(o)}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
              <div className="flex items-center gap-1.5">
                <span>מידה</span>
                <OrderSizeEditor id={o.id} current={o.size} />
              </div>
              <div className="flex items-center gap-1.5">
                <span>כמות</span>
                <OrderQuantityEditor id={o.id} current={o.quantity} />
              </div>
            </div>
          </div>
        </div>
        <DeleteOrderButton id={o.id} label={o.customer_name} variant="full" />
      </div>
      <div className="mt-3 flex flex-col gap-1.5 border-t border-neutral-100 pt-3 text-sm">
        <p className="flex items-center gap-2 text-neutral-700">
          <User className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.75} />
          {o.customer_name}
        </p>
        <PhoneCell phone={o.phone} />
        <HeardFromEditor id={o.id} initial={o.heard_from} />
        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-600">
          <span className="inline-flex items-center gap-1">
            <span className="text-neutral-400">תשלום</span>
            <PaidToggle id={o.id} initial={o.is_paid} />
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="text-neutral-400">אריזה</span>
            <PackedToggle id={o.id} initial={o.is_packed} />
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="text-neutral-400">איסוף</span>
            <CollectedToggle id={o.id} initial={o.is_collected} />
          </span>
        </div>
        {o.notes && (
          <p className="flex items-start gap-2 whitespace-pre-wrap text-neutral-700">
            <StickyNote
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400"
              strokeWidth={1.75}
            />
            <span>{o.notes}</span>
          </p>
        )}
        <div className="mt-1">
          <AdminNoteEditor
            id={o.id}
            initialNote={o.admin_note}
            action={updateOrderAdminNote}
          />
        </div>
      </div>
    </li>
  );
}
