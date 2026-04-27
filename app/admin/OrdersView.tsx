"use client";

import { useMemo, useState } from "react";
import {
  Copy,
  Inbox,
  Megaphone,
  Phone,
  Search,
  StickyNote,
  User,
} from "lucide-react";
import type { Order } from "@/lib/db";
import { updateOrderAdminNote } from "@/app/actions/orders";
import { DeleteOrderButton } from "./DeleteOrderButton";
import { AdminNoteEditor } from "./AdminNoteEditor";
import { OrderSizeEditor } from "./OrderSizeEditor";

const dateFmt = new Intl.DateTimeFormat("he-IL", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jerusalem",
});

function productLabel(o: Order) {
  return [o.variant_type, o.product, o.color && `(${o.color})`]
    .filter(Boolean)
    .join(" ");
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

const SIZE_ORDER = ["S", "M", "L", "XL"];

type Mode = "chrono" | "by-customer";

type CustomerGroup = {
  phone: string;
  name: string;
  orders: Order[];
  latestAt: number;
};

function groupByCustomer(orders: Order[]): CustomerGroup[] {
  const map = new Map<string, CustomerGroup>();
  for (const o of orders) {
    const phoneKey = o.phone.replace(/\D/g, "");
    let g = map.get(phoneKey);
    if (!g) {
      g = { phone: o.phone, name: o.customer_name, orders: [], latestAt: 0 };
      map.set(phoneKey, g);
    }
    g.orders.push(o);
    const t = new Date(o.created_at).getTime();
    if (t > g.latestAt) {
      g.latestAt = t;
      g.name = o.customer_name;
      g.phone = o.phone;
    }
  }
  const list = Array.from(map.values());
  for (const g of list) {
    g.orders.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }
  list.sort((a, b) => b.latestAt - a.latestAt);
  return list;
}

export function OrdersView({ orders }: { orders: Order[] }) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>("chrono");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    () => new Set()
  );
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(
    () => new Set()
  );

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
        count: number;
      }
    >();
    for (const o of orders) {
      const key = productKey(o);
      let g = map.get(key);
      if (!g) {
        g = { key, label: shortProductLabel(o), count: 0 };
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
    return result;
  }, [orders, query, selectedProducts, selectedSizes]);

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
  }

  const hasActiveFilters =
    query.trim().length > 0 ||
    selectedProducts.size > 0 ||
    selectedSizes.size > 0;

  if (orders.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center rounded border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
        <Inbox className="h-8 w-8 text-neutral-400" strokeWidth={1.5} />
        <p className="mt-3 text-sm text-neutral-500">אין הזמנות עדיין</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400"
            strokeWidth={1.75}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש לפי שם, טלפון, מוצר, הערה…"
            className="h-10 w-full rounded border border-neutral-200 bg-white pr-9 pl-3 text-sm text-neutral-900 outline-none focus:border-neutral-400"
          />
        </div>
        <div className="inline-flex shrink-0 rounded border border-neutral-200 bg-white p-0.5">
          <ToggleBtn active={mode === "chrono"} onClick={() => setMode("chrono")}>
            כרונולוגי
          </ToggleBtn>
          <ToggleBtn
            active={mode === "by-customer"}
            onClick={() => setMode("by-customer")}
          >
            לפי לקוח
          </ToggleBtn>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {productOptions.length > 1 && (
          <ChipRow label="מוצר">
            {productOptions.map((p) => (
              <Chip
                key={p.key}
                active={selectedProducts.has(p.key)}
                onClick={() => toggleProduct(p.key)}
              >
                <span>{p.label}</span>
                <span
                  className={`text-[9px] tabular-nums ${
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
                className={`text-[9px] tabular-nums ${
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
      </div>

      <div className="mt-2 flex items-center gap-3">
        <p className="text-[11px] text-neutral-500">
          {filtered.length === orders.length
            ? `${orders.length} הזמנות`
            : `${filtered.length} מתוך ${orders.length}`}
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="cursor-pointer text-[11px] text-neutral-500 underline-offset-2 hover:text-neutral-900 hover:underline"
          >
            נקה סינון
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-4 rounded border border-dashed border-neutral-300 bg-white px-6 py-10 text-center">
          <p className="text-xs text-neutral-500">אין תוצאות לחיפוש</p>
        </div>
      ) : mode === "chrono" ? (
        <ChronoView orders={filtered} dupeMap={dupeMap} />
      ) : (
        <CustomerView orders={filtered} dupeMap={dupeMap} />
      )}
    </div>
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
      <span className="ml-1 text-[10px] font-medium uppercase tracking-wide text-neutral-500">
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
    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors";
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

function ToggleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded px-3 py-1.5 text-[11px] transition-colors ${
        active
          ? "bg-neutral-900 text-white"
          : "text-neutral-600 hover:text-neutral-900"
      }`}
    >
      {children}
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
      <div className="mt-4 hidden overflow-hidden rounded border border-neutral-200 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-neutral-50 text-[11px] uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">תאריך</th>
                <th className="px-4 py-3 font-medium">מוצר</th>
                <th className="px-4 py-3 font-medium">מידה</th>
                <th className="px-4 py-3 font-medium">לקוח</th>
                <th className="px-4 py-3 font-medium">טלפון</th>
                <th className="px-4 py-3 font-medium">הערות</th>
                <th className="px-4 py-3 font-medium">הערה לעצמי</th>
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
    <tr className="border-t border-neutral-200 align-top transition-colors hover:bg-neutral-50">
      <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-500">
        {dateFmt.format(new Date(o.created_at))}
      </td>
      <td className="px-4 py-3 text-neutral-900">
        <div className="flex flex-col gap-1">
          <span>{productLabel(o)}</span>
          <DupeBadge count={dupeCount} />
        </div>
      </td>
      <td className="px-4 py-3 text-neutral-900">
        <OrderSizeEditor id={o.id} current={o.size} />
      </td>
      <td className="px-4 py-3 text-neutral-900">
        <div className="flex flex-col gap-1">
          <span>{o.customer_name}</span>
          {o.heard_from && (
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] text-sky-700">
              <Megaphone className="h-3 w-3" strokeWidth={1.75} />
              {o.heard_from}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-neutral-900">
        <PhoneCell phone={o.phone} />
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
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-neutral-500">
              {dateFmt.format(new Date(o.created_at))}
            </span>
            <DupeBadge count={dupeCount} />
          </div>
          <p className="mt-2 text-sm font-medium text-neutral-900">
            {productLabel(o)}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
            <span>מידה</span>
            <OrderSizeEditor id={o.id} current={o.size} />
          </div>
        </div>
        <DeleteOrderButton id={o.id} label={o.customer_name} />
      </div>
      <div className="mt-3 flex flex-col gap-1.5 border-t border-neutral-100 pt-3 text-sm">
        <p className="flex items-center gap-2 text-neutral-700">
          <User className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.75} />
          {o.customer_name}
        </p>
        <PhoneCell phone={o.phone} />
        {o.heard_from && (
          <p className="flex items-center gap-2 text-sky-700">
            <Megaphone className="h-3.5 w-3.5 text-sky-500" strokeWidth={1.75} />
            <span className="text-xs">{o.heard_from}</span>
          </p>
        )}
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

function CustomerView({
  orders,
  dupeMap,
}: {
  orders: Order[];
  dupeMap: Map<string, number>;
}) {
  const groups = useMemo(() => groupByCustomer(orders), [orders]);

  return (
    <div className="mt-4 flex flex-col gap-4">
      {groups.map((g) => {
        const phoneKey = g.phone.replace(/\D/g, "");
        return (
          <section
            key={phoneKey}
            className="overflow-hidden rounded border border-neutral-200 bg-white shadow-sm"
          >
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-medium text-white">
                  {g.orders.length}
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-neutral-900">
                    {g.name}
                  </span>
                  <span className="text-[11px] text-neutral-500" dir="ltr">
                    {g.phone}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${g.phone}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                  title="חיוג"
                >
                  <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
                </a>
                <WaButton phone={g.phone} />
              </div>
            </header>
            <ul className="divide-y divide-neutral-100">
              {g.orders.map((o) => {
                const dupeCount = dupeMap.get(dupeKey(o)) ?? 1;
                return (
                  <li
                    key={o.id}
                    className="flex flex-wrap items-start gap-3 px-4 py-3"
                  >
                    <span className="w-24 shrink-0 text-[11px] text-neutral-500">
                      {dateFmt.format(new Date(o.created_at))}
                    </span>
                    <div className="min-w-0 flex-1 flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-neutral-900">
                          {productLabel(o)}
                        </span>
                        <DupeBadge count={dupeCount} />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                        <span>מידה</span>
                        <OrderSizeEditor id={o.id} current={o.size} />
                      </div>
                      {o.heard_from && (
                        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] text-sky-700">
                          <Megaphone className="h-3 w-3" strokeWidth={1.75} />
                          {o.heard_from}
                        </span>
                      )}
                      {o.notes && (
                        <p className="flex items-start gap-1.5 whitespace-pre-wrap text-xs text-neutral-700">
                          <StickyNote
                            className="mt-0.5 h-3 w-3 shrink-0 text-neutral-400"
                            strokeWidth={1.75}
                          />
                          <span>{o.notes}</span>
                        </p>
                      )}
                      <AdminNoteEditor
                        id={o.id}
                        initialNote={o.admin_note}
                        action={updateOrderAdminNote}
                      />
                    </div>
                    <DeleteOrderButton id={o.id} label={o.customer_name} />
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
