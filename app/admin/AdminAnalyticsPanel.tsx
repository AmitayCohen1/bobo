"use client";

import { useMemo, useState } from "react";
import { imagePathFor } from "@/lib/product-image";
import { ExportProductsButton } from "./ExportProductsButton";

type GroupedItem = {
  product: string;
  variant_type: string | null;
  color: string | null;
  size: string;
  is_waitlist: boolean;
  count: number;
  orders: number;
};
type SizeCount = { size: string; count: number };
type SourceCount = { heard_from: string; count: number };

const SIZE_ORDER = ["S", "M", "L", "XL"];

const DEFAULT_EXCLUDED_PRODUCTS = new Set(["חולצת רקמה בעזרת השף"]);

export type ProductRollup = {
  key: string;
  product: string;
  variant_type: string | null;
  color: string | null;
  image: string;
  total: number;
  orders: number;
  waitlist: number;
  bySize: { size: string; count: number }[];
};

export function AdminAnalyticsPanel({
  grouped,
  bySize,
  bySource,
}: {
  grouped: GroupedItem[];
  bySize: SizeCount[];
  bySource: SourceCount[];
}) {
  const products = useMemo(() => rollupByProduct(grouped), [grouped]);
  const allKeys = useMemo(() => products.map((p) => p.key), [products]);
  const defaultKeys = useMemo(
    () =>
      products
        .filter((p) => !DEFAULT_EXCLUDED_PRODUCTS.has(p.product))
        .map((p) => p.key),
    [products]
  );

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(defaultKeys)
  );

  const allSelected = selected.size === products.length;
  const noneSelected = selected.size === 0;

  const filteredUnits = useMemo(
    () =>
      products.reduce(
        (sum, p) => sum + (selected.has(p.key) ? p.total : 0),
        0
      ),
    [products, selected]
  );
  const filteredOrders = useMemo(
    () =>
      products.reduce(
        (sum, p) => sum + (selected.has(p.key) ? p.orders : 0),
        0
      ),
    [products, selected]
  );
  const totalUnits = useMemo(
    () => products.reduce((sum, p) => sum + p.total, 0),
    [products]
  );
  const totalOrders = useMemo(
    () => products.reduce((sum, p) => sum + p.orders, 0),
    [products]
  );

  const sortedSizes = [...bySize].sort(
    (a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size)
  );
  const sizeSlices = sortedSizes.map((s) => ({
    label: s.size,
    value: s.count,
  }));
  const sourceSlices = bySource.map((s) => ({
    label: s.heard_from,
    value: s.count,
  }));

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(allKeys));
  }

  function selectNone() {
    setSelected(new Set());
  }

  return (
    <section className="space-y-2">
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 px-3 py-2">
          <h3 className="text-sm font-semibold tracking-[-0.01em] text-neutral-900">
            פירוט מוצרים
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {products.length > 0 && (
              <span className="text-[11px] tabular-nums text-neutral-400">
                {selected.size}/{products.length} נבחרו
              </span>
            )}
            <button
              type="button"
              onClick={selectAll}
              disabled={allSelected}
              className="cursor-pointer text-[11px] font-medium text-neutral-600 underline-offset-4 hover:text-neutral-900 hover:underline disabled:cursor-not-allowed disabled:text-neutral-300 disabled:no-underline"
            >
              בחר הכל
            </button>
            <button
              type="button"
              onClick={selectNone}
              disabled={noneSelected}
              className="cursor-pointer text-[11px] font-medium text-neutral-600 underline-offset-4 hover:text-neutral-900 hover:underline disabled:cursor-not-allowed disabled:text-neutral-300 disabled:no-underline"
            >
              נקה
            </button>
            <ExportProductsButton products={products} />
          </div>
        </div>
        {products.length === 0 ? (
          <Empty />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x md:divide-x-reverse md:divide-neutral-100">
            {products.map((product) => (
              <ProductRow
                key={product.key}
                product={product}
                checked={selected.has(product.key)}
                onToggle={() => toggle(product.key)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <Stat
          label="סה״כ יחידות"
          value={filteredUnits}
          total={totalUnits}
          partial={!allSelected}
        />
        <Stat
          label="סה״כ הזמנות"
          value={filteredOrders}
          total={totalOrders}
          partial={!allSelected}
        />
      </div>

      <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs shadow-sm">
          <DistRow label="מידות" slices={sizeSlices} />
        </div>
        {sourceSlices.length > 0 && (
          <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs shadow-sm">
            <DistRow label="מקורות" slices={sourceSlices} />
          </div>
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
  slices: { label: string; value: number }[];
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
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
      <span className="ml-1 font-medium text-neutral-500">{label}</span>
      {slices.map((s) => {
        const pct = (s.value / total) * 100;
        return (
          <span
            key={s.label}
            className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-0.5"
          >
            <span className="text-neutral-600">{s.label}</span>
            <span className="tabular-nums font-semibold text-neutral-900">
              {s.value}
            </span>
            <span className="tabular-nums text-neutral-400">
              {pct.toFixed(0)}%
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
        orders: 0,
        waitlist: 0,
        bySize: [],
      };
      map.set(key, group);
      sizeMap.set(key, new Map());
    }
    group.total += r.count;
    group.orders += r.orders;
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
  }
  all.sort((a, b) => b.total - a.total);
  return all;
}

function Stat({
  label,
  value,
  total,
  partial,
}: {
  label: string;
  value: number;
  total: number;
  partial: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-sm">
      <span className="truncate text-xs text-neutral-500">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className="text-xl font-semibold leading-none tabular-nums text-neutral-900">
          {value}
        </span>
        {partial && (
          <span className="text-[11px] tabular-nums text-neutral-400">
            / {total}
          </span>
        )}
      </span>
    </div>
  );
}

function Empty({ msg = "אין נתונים" }: { msg?: string }) {
  return (
    <div className="px-3 py-6 text-center text-xs text-neutral-400">{msg}</div>
  );
}

function ProductRow({
  product,
  checked,
  onToggle,
}: {
  product: ProductRollup;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 border-b border-neutral-100 px-3 py-2.5 transition-colors last:border-b-0 hover:bg-neutral-50/70 md:[&:nth-last-child(-n+2)]:border-b-0 ${
        checked ? "" : "opacity-50"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="h-4 w-4 shrink-0 cursor-pointer accent-neutral-900"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={product.image}
        alt={product.product}
        className="h-10 w-10 shrink-0 object-contain"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-medium leading-tight text-neutral-900">
            {productLabel(product)}
          </p>
          <div className="flex shrink-0 items-baseline gap-1">
            <span className="text-lg font-semibold leading-none tabular-nums text-neutral-900">
              {product.total}
            </span>
            <span className="text-[10px] text-neutral-400">יח׳</span>
          </div>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[11px]">
          {product.bySize.map((s) => (
            <span
              key={s.size}
              className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-0.5"
            >
              <span className="text-neutral-500">{s.size}</span>
              <span className="font-semibold tabular-nums text-neutral-900">
                {s.count}
              </span>
            </span>
          ))}
          {product.waitlist > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-1.5 py-0.5">
              <span className="tabular-nums font-semibold text-neutral-900">
                {product.waitlist}
              </span>
              <span className="text-neutral-500">המתנה</span>
            </span>
          )}
        </div>
      </div>
    </label>
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
