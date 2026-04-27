import { redirect } from "next/navigation";
import { LogOut, Package } from "lucide-react";
import { sql } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { logoutAction } from "@/app/admin/actions";
import { imagePathFor } from "@/lib/product-image";
import { TabNav } from "../TabNav";

export const metadata = { title: "אנליטיקה · בובו" };
export const dynamic = "force-dynamic";

type GroupedItem = {
  product: string;
  variant_type: string | null;
  color: string | null;
  size: string;
  is_waitlist: boolean;
  count: number;
};
type SizeCount = { size: string; count: number };
type DailyCount = { day: string; count: number };
type SourceCount = { heard_from: string; count: number };
type SingleCount = { count: number };

const SIZE_ORDER = ["S", "M", "L", "XL"];
const SIZE_COLORS: Record<string, string> = {
  S: "#94a3b8",
  M: "#10b981",
  L: "#0ea5e9",
  XL: "#f59e0b",
};
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

function productTitle(o: {
  variant_type: string | null;
  product: string;
  color: string | null;
}): string {
  return [o.variant_type, o.product, o.color && `(${o.color})`]
    .filter(Boolean)
    .join(" ");
}

const dayLabel = new Intl.DateTimeFormat("he-IL", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Jerusalem",
});

function fillDays(rows: DailyCount[], days = 30) {
  const map = new Map(rows.map((r) => [r.day, r.count]));
  const out: { day: string; count: number; label: string }[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${dd}`;
    out.push({ day: key, count: map.get(key) ?? 0, label: dayLabel.format(d) });
  }
  return out;
}

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
      .sort(
        (a, b) =>
          SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size)
      );
  }
  all.sort((a, b) => b.total - a.total);
  return all;
}

export default async function AnalyticsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const [
    grouped,
    bySize,
    daily,
    bySource,
    total,
    weekRow,
    monthRow,
    waitlistTotal,
  ] = (await Promise.all([
    sql`
      SELECT product, variant_type, color, size, is_waitlist, COALESCE(SUM(quantity), 0)::int AS count
      FROM orders
      GROUP BY product, variant_type, color, size, is_waitlist
      ORDER BY count DESC
    `,
    sql`
      SELECT size, COALESCE(SUM(quantity), 0)::int AS count
      FROM orders
      GROUP BY size
    `,
    sql`
      SELECT to_char(date_trunc('day', created_at AT TIME ZONE 'Asia/Jerusalem'), 'YYYY-MM-DD') AS day, COALESCE(SUM(quantity), 0)::int AS count
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY day
      ORDER BY day
    `,
    sql`
      SELECT heard_from, COALESCE(SUM(quantity), 0)::int AS count
      FROM orders
      WHERE heard_from IS NOT NULL AND heard_from <> ''
      GROUP BY heard_from
      ORDER BY count DESC
    `,
    sql`SELECT COALESCE(SUM(quantity), 0)::int AS count FROM orders`,
    sql`SELECT COALESCE(SUM(quantity), 0)::int AS count FROM orders WHERE created_at >= NOW() - INTERVAL '7 days'`,
    sql`SELECT COALESCE(SUM(quantity), 0)::int AS count FROM orders WHERE created_at >= NOW() - INTERVAL '30 days'`,
    sql`SELECT COALESCE(SUM(quantity), 0)::int AS count FROM orders WHERE is_waitlist = true`,
  ])) as [
    GroupedItem[],
    SizeCount[],
    DailyCount[],
    SourceCount[],
    SingleCount[],
    SingleCount[],
    SingleCount[],
    SingleCount[],
  ];

  const totalCount = total[0]?.count ?? 0;
  const weekCount = weekRow[0]?.count ?? 0;
  const monthCount = monthRow[0]?.count ?? 0;
  const waitlistCount = waitlistTotal[0]?.count ?? 0;

  const products = rollupByProduct(grouped);
  const days = fillDays(daily);
  const dailyMax = Math.max(1, ...days.map((d) => d.count));

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
    <div className="min-h-screen bg-neutral-50 px-4 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white sm:h-11 sm:w-11">
              <Package className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <h1 className="text-lg font-medium tracking-[-0.01em] text-neutral-900">
                אנליטיקה
              </h1>
              <p className="text-xs text-neutral-500">
                בובו · מחובר כ־{session.username}
              </p>
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded border border-neutral-300 bg-white px-3 py-2 text-[11px] uppercase tracking-wide text-neutral-700 transition-colors hover:bg-neutral-100 sm:w-auto"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
              התנתקות
            </button>
          </form>
        </header>

        <TabNav current="analytics" />

        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <Stat label="סה״כ" value={totalCount} />
          <Stat label="7 ימים" value={weekCount} accent="emerald" />
          <Stat label="30 ימים" value={monthCount} />
          <Stat label="רשימת המתנה" value={waitlistCount} accent="amber" />
        </div>

        <Section title="פירוט מוצרים">
          {products.length === 0 ? (
            <Empty />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.key} product={p} />
              ))}
            </div>
          )}
        </Section>

        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card title="התפלגות לפי מידה">
            {sizeSlices.length === 0 ? (
              <Empty />
            ) : (
              <Donut slices={sizeSlices} centerLabel="מידות" />
            )}
          </Card>
          <Card title="מאיפה הגיעו">
            {sourceSlices.length === 0 ? (
              <Empty msg="עוד אין נתונים" />
            ) : (
              <Donut slices={sourceSlices} centerLabel="מקורות" />
            )}
          </Card>
        </div>

        <Section title="הזמנות לפי יום (30 ימים)">
          {totalCount === 0 ? (
            <Empty />
          ) : (
            <div className="rounded border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex h-40 items-end gap-[2px]" dir="ltr">
                {days.map((d) => {
                  const h = (d.count / dailyMax) * 100;
                  return (
                    <div
                      key={d.day}
                      title={`${d.label} · ${d.count}`}
                      className={`flex-1 rounded-sm transition-colors ${
                        d.count > 0
                          ? "bg-emerald-500 hover:bg-emerald-600"
                          : "bg-neutral-100"
                      }`}
                      style={{ height: `${Math.max(h, 4)}%` }}
                    />
                  );
                })}
              </div>
              <div
                className="mt-2 flex justify-between text-[10px] text-neutral-500"
                dir="ltr"
              >
                <span>{days[0]?.label}</span>
                <span>{days[days.length - 1]?.label}</span>
              </div>
            </div>
          )}
        </Section>

      </div>
    </div>
  );
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
    <div className="rounded border border-neutral-200 bg-white px-3 py-3 sm:px-4">
      <p className="text-[10px] uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className={`mt-1 text-xl font-medium sm:text-2xl ${valueColor}`}>
        {value}
      </p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-medium tracking-[-0.01em] text-neutral-900">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded border border-neutral-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-medium tracking-[-0.01em] text-neutral-900">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Empty({ msg = "אין נתונים" }: { msg?: string }) {
  return (
    <div className="rounded border border-dashed border-neutral-300 bg-white px-6 py-10 text-center">
      <p className="text-xs text-neutral-500">{msg}</p>
    </div>
  );
}

function ProductCard({ product }: { product: ProductRollup }) {
  const max = Math.max(1, ...product.bySize.map((s) => s.count));
  return (
    <div className="flex flex-col rounded border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.product}
          className="h-20 w-20 shrink-0 object-contain"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-tight text-neutral-900">
            {productTitle(product)}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-wide text-neutral-500">
            סה״כ
          </p>
          <p className="text-2xl font-medium leading-none text-neutral-900">
            {product.total}
          </p>
          {product.waitlist > 0 && (
            <p className="mt-1 text-[10px] text-amber-700">
              מזה {product.waitlist} ברשימת המתנה
            </p>
          )}
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-2">
        {product.bySize.map((s) => {
          const pct = (s.count / max) * 100;
          const color = SIZE_COLORS[s.size] ?? "#737373";
          return (
            <div key={s.size} className="flex items-center gap-3">
              <span className="w-7 text-xs font-medium text-neutral-700">
                {s.size}
              </span>
              <div
                className="h-2 flex-1 rounded-full bg-neutral-100"
                dir="ltr"
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
              <span className="w-6 text-left text-xs tabular-nums text-neutral-700">
                {s.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Donut({
  slices,
  centerLabel,
}: {
  slices: { label: string; value: number; color: string }[];
  centerLabel?: string;
}) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return <Empty />;

  let acc = 0;
  const stops = slices.map((s) => {
    const start = (acc / total) * 360;
    acc += s.value;
    const end = (acc / total) * 360;
    return `${s.color} ${start}deg ${end}deg`;
  });
  const gradient = `conic-gradient(${stops.join(", ")})`;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-center sm:gap-8">
      <div
        className="relative grid place-items-center"
        style={{ width: 168, height: 168 }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{ backgroundImage: gradient }}
        />
        <div className="relative flex h-[64%] w-[64%] flex-col items-center justify-center rounded-full bg-white">
          <span className="text-2xl font-medium text-neutral-900">
            {total}
          </span>
          {centerLabel && (
            <span className="mt-0.5 text-[10px] uppercase tracking-wide text-neutral-500">
              {centerLabel}
            </span>
          )}
        </div>
      </div>
      <ul className="flex flex-col gap-2 text-sm sm:min-w-[140px]">
        {slices.map((s) => {
          const pct = total > 0 ? (s.value / total) * 100 : 0;
          return (
            <li key={s.label} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: s.color }}
              />
              <span className="flex-1 truncate text-neutral-800">
                {s.label}
              </span>
              <span className="text-xs tabular-nums text-neutral-500">
                {s.value} · {pct.toFixed(0)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
