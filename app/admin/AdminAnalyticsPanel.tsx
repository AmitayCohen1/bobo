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

type ProductRollup = {
  key: string;
  product: string;
  variant_type: string | null;
  color: string | null;
  image: string;
  total: number;
  waitlist: number;
  bySize: { size: string; count: number }[];
};

export function AdminAnalyticsPanel({
  grouped,
  bySize,
  bySource,
  totalCount,
  ordersCount,
}: {
  grouped: GroupedItem[];
  bySize: SizeCount[];
  bySource: SourceCount[];
  totalCount: number;
  ordersCount: number;
}) {
  const products = rollupByProduct(grouped);

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

  return (
    <section className="space-y-2">
      <div className="grid grid-cols-2 gap-1.5">
        <Stat label="סה״כ יחידות" value={totalCount} />
        <Stat label="סה״כ הזמנות" value={ordersCount} />
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-2">
          <h3 className="text-sm font-semibold tracking-[-0.01em] text-neutral-900">
            פירוט מוצרים
          </h3>
          {products.length > 0 && (
            <span className="text-[11px] tabular-nums text-neutral-400">
              {products.length} מוצרים
            </span>
          )}
        </div>
        {products.length === 0 ? (
          <Empty />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x md:divide-x-reverse md:divide-neutral-100">
            {products.map((product) => (
              <ProductRow key={product.key} product={product} />
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs shadow-sm">
        <DistRow label="מידות" slices={sizeSlices} />
        {sourceSlices.length > 0 && (
          <>
            <div className="my-1.5 border-t border-neutral-100" />
            <DistRow label="מקורות" slices={sourceSlices} />
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
        waitlist: 0,
        bySize: [],
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
  }
  all.sort((a, b) => b.total - a.total);
  return all;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-sm">
      <span className="truncate text-xs text-neutral-500">{label}</span>
      <span className="text-xl font-semibold leading-none tabular-nums text-neutral-900">
        {value}
      </span>
    </div>
  );
}

function Empty({ msg = "אין נתונים" }: { msg?: string }) {
  return (
    <div className="px-3 py-6 text-center text-xs text-neutral-400">{msg}</div>
  );
}

function ProductRow({ product }: { product: ProductRollup }) {
  return (
    <div className="flex items-center gap-3 border-b border-neutral-100 px-3 py-2.5 last:border-b-0 md:[&:nth-last-child(-n+2)]:border-b-0">
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
