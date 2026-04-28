import type { ReactNode } from "react";
import { imagePathFor } from "@/lib/product-image";

type GroupedItem = {
  product: string;
  variant_type: string | null;
  color: string | null;
  size: string;
  is_waitlist: boolean;
  count: number;
};
type SizeCount = { size: string; count: number };
type SourceCount = { heard_from: string; count: number };

const SIZE_ORDER = ["S", "M", "L", "XL"];
const SIZE_COLORS: Record<string, string> = {
  S: "#94a3b8",
  M: "#10b981",
  L: "#0ea5e9",
  XL: "#f59e0b",
};
const COLOR_ACCENT: Record<string, string> = {
  ירוק: "#2d4c3b",
  חום: "#5d4037",
  שחור: "#111827",
  לבן: "#e5e7eb",
  אפור: "#6b7280",
  כחול: "#2563eb",
  תכלת: "#0ea5e9",
  ורוד: "#ec4899",
  אדום: "#ef4444",
  צהוב: "#eab308",
};
const DEFAULT_ACCENT = "#64748b";
const SOURCE_PALETTE = [
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#a855f7",
  "#ec4899",
  "#6366f1",
  "#84cc16",
  "#94a3b8",
];

type ProductRollup = {
  key: string;
  product: string;
  variant_type: string | null;
  color: string | null;
  image: string;
  total: number;
  waitlist: number;
  bySize: { size: string; count: number }[];
  accent: string;
};

export function AdminAnalyticsPanel({
  grouped,
  bySize,
  bySource,
  totalCount,
  weekCount,
  monthCount,
  waitlistCount,
}: {
  grouped: GroupedItem[];
  bySize: SizeCount[];
  bySource: SourceCount[];
  totalCount: number;
  weekCount: number;
  monthCount: number;
  waitlistCount: number;
}) {
  const products = rollupByProduct(grouped);

  const sortedSizes = [...bySize].sort(
    (a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size)
  );
  const sizeSlices = sortedSizes.map((s) => ({
    label: s.size,
    value: s.count,
    color: SIZE_COLORS[s.size] ?? "#737373",
  }));
  const sourceSlices = bySource.map((s, i) => ({
    label: s.heard_from,
    value: s.count,
    color: SOURCE_PALETTE[i % SOURCE_PALETTE.length],
  }));

  return (
    <section className="space-y-2">
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <Stat label="סה״כ יחידות" value={totalCount} />
        <Stat label="ב־7 ימים" value={weekCount} accent="emerald" />
        <Stat label="ב־30 ימים" value={monthCount} />
        <Stat label="רשימת המתנה" value={waitlistCount} accent="amber" />
      </div>

      <p className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs leading-5 text-amber-800">
        כל המדדים ביחידות (לא בהזמנות), אלא אם צוין אחרת.
      </p>

      <Card title="פירוט מוצרים">
        {products.length === 0 ? (
          <Empty />
        ) : (
          <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
            {products.map((product) => (
              <ProductRow key={product.key} product={product} />
            ))}
          </div>
        )}
      </Card>

      <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs">
        <DistRow label="מידות (יחידות)" slices={sizeSlices} />
        {sourceSlices.length > 0 && (
          <>
            <div className="my-1.5 border-t border-neutral-100" />
            <DistRow label="מקורות (יחידות)" slices={sourceSlices} />
          </>
        )}
      </div>
    </section>
  );
}

function DistRow({
  label,
  slices,
}: {
  label: string;
  slices: { label: string; value: number; color: string }[];
}) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-baseline gap-2">
        <span className="font-medium text-neutral-500">{label}</span>
        <span className="text-neutral-400">אין נתונים</span>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="font-medium text-neutral-500">{label}</span>
      {slices.map((s) => {
        const pct = (s.value / total) * 100;
        return (
          <span key={s.label} className="flex items-center gap-1">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: s.color }}
            />
            <span className="text-neutral-800">{s.label}</span>
            <span className="tabular-nums font-medium text-neutral-900">
              {s.value}
            </span>
            <span className="tabular-nums text-neutral-400">
              ({pct.toFixed(0)}%)
            </span>
          </span>
        );
      })}
    </div>
  );
}

function rollupByProduct(rows: GroupedItem[]): ProductRollup[] {
  const map = new Map<string, ProductRollup>();
  const sizeMap = new Map<string, Map<string, number>>();
  for (const r of rows) {
    const key = `${r.product}|${r.variant_type ?? ""}|${r.color ?? ""}`;
    let group = map.get(key);
    if (!group) {
      group = {
        key,
        product: r.product,
        variant_type: r.variant_type,
        color: r.color,
        image: imagePathFor({
          product: r.product,
          variantType: r.variant_type,
          color: r.color,
        }),
        total: 0,
        waitlist: 0,
        bySize: [],
        accent: DEFAULT_ACCENT,
      };
      map.set(key, group);
      sizeMap.set(key, new Map());
    }
    group.total += r.count;
    if (r.is_waitlist) group.waitlist += r.count;
    const sizeBucket = sizeMap.get(key)!;
    sizeBucket.set(r.size, (sizeBucket.get(r.size) ?? 0) + r.count);
  }
  const all = Array.from(map.values());
  for (const g of all) {
    const sizes = sizeMap.get(g.key)!;
    g.bySize = Array.from(sizes.entries())
      .map(([size, count]) => ({ size, count }))
      .sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size));
    g.accent = g.color ? COLOR_ACCENT[g.color] ?? DEFAULT_ACCENT : DEFAULT_ACCENT;
  }
  all.sort((a, b) => b.total - a.total);
  return all;
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "emerald" | "amber";
}) {
  const valueColor =
    accent === "emerald"
      ? "text-emerald-700"
      : accent === "amber"
        ? "text-amber-700"
        : "text-neutral-900";
  return (
    <div className="flex items-baseline justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-sm">
      <span className="truncate text-xs text-neutral-500">{label}</span>
      <span className={`text-xl font-semibold leading-none tabular-nums ${valueColor}`}>
        {value}
      </span>
    </div>
  );
}

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-neutral-200 bg-white p-3 shadow-sm ${className}`}
    >
      <h3 className="mb-2 text-sm font-semibold tracking-[-0.01em] text-neutral-900">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Empty({ msg = "אין נתונים" }: { msg?: string }) {
  return (
    <div className="rounded border border-dashed border-neutral-300 bg-white px-3 py-4 text-center">
      <p className="text-xs text-neutral-500">{msg}</p>
    </div>
  );
}

function ProductRow({ product }: { product: ProductRollup }) {
  return (
    <div
      className="relative flex items-center gap-2.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-2"
      style={{ borderColor: `${product.accent}33` }}
    >
      <span
        className="absolute inset-y-0 right-0 w-[3px] rounded-r"
        style={{ backgroundColor: product.accent }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={product.image}
        alt={product.product}
        className="h-10 w-10 shrink-0 object-contain"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium leading-tight text-neutral-900">
            {productLabel(product)}
          </p>
          {product.color && (
            <span
              className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none"
              style={{
                backgroundColor: `${product.accent}14`,
                color: product.accent,
              }}
            >
              {product.color}
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-neutral-500">
          {product.bySize.map((s, i) => {
            const color = SIZE_COLORS[s.size] ?? "#737373";
            return (
              <span key={s.size} className="flex items-center gap-1">
                {i > 0 && <span className="text-neutral-300">·</span>}
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: color }}
                />
                <span className="tabular-nums text-neutral-700">{s.count}</span>
                <span>{s.size}</span>
              </span>
            );
          })}
          {product.waitlist > 0 && (
            <>
              <span className="text-neutral-300">·</span>
              <span className="text-amber-700">{product.waitlist} המתנה</span>
            </>
          )}
        </div>
      </div>
      <p
        className="shrink-0 text-xl font-semibold leading-none tabular-nums"
        style={{ color: product.accent }}
      >
        {product.total}
      </p>
    </div>
  );
}

function productLabel(o: {
  variant_type: string | null;
  product: string;
  color: string | null;
}): string {
  return [o.variant_type, o.product, o.color && `(${o.color})`]
    .filter(Boolean)
    .join(" ");
}


