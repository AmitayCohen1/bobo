import { redirect } from "next/navigation";
import { LogOut, Package, ShieldCheck } from "lucide-react";
import { sql, type Order } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { logoutAction } from "@/app/admin/actions";
import { imagePathFor } from "@/lib/product-image";
import { ExportOrdersButton } from "./ExportOrdersButton";
import { TabNav } from "./TabNav";
import { OrdersView } from "./OrdersView";

export const metadata = { title: "ניהול הזמנות" };
export const dynamic = "force-dynamic";
const SIZE_ORDER = ["S", "M", "L", "XL"];
const SIZE_META: Record<string, { label: string; color: string }> = {
  S: { label: "S", color: "bg-slate-400" },
  M: { label: "M", color: "bg-emerald-500" },
  L: { label: "L", color: "bg-sky-500" },
  XL: { label: "XL", color: "bg-amber-500" },
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

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const rows = (await sql`
    SELECT id, product, variant_type, color, size, quantity, customer_name, phone, notes, admin_note, heard_from, status, is_waitlist, created_at
    FROM orders
    ORDER BY created_at DESC
    LIMIT 500
  `) as Order[];
  const productCards = rollupProducts(rows);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.95),rgba(245,247,250,1)_36%,rgba(235,239,244,1)_100%)] px-3 py-3 md:px-6 md:py-4">
      <div className="mx-auto flex max-w-7xl flex-col gap-3">
        <header className="rounded-3xl border border-white/70 bg-white/85 px-4 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur md:px-5 md:py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 text-white shadow-sm">
                <Package className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-semibold tracking-[-0.03em] text-neutral-950">
                    הזמנות
                  </h1>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.9} />
                    מחובר כ־{session.username}
                  </span>
                </div>
                <p className="max-w-2xl text-xs leading-5 text-neutral-500">
                  לוח ניהול להזמנות וליחידות. כל כרטיס מפריד במפורש בין מספר
                  ההזמנות לבין סך היחידות.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <ExportOrdersButton orders={rows} />
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50 sm:w-auto"
                >
                  <LogOut className="h-4 w-4" strokeWidth={1.75} />
                  התנתקות
                </button>
              </form>
            </div>
          </div>
        </header>

        <TabNav current="orders" />

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {productCards.map((product) => (
            <ProductCard key={product.key} product={product} />
          ))}
        </section>

        <OrdersView orders={rows} />
      </div>
    </main>
  );
}

type ProductCardData = {
  key: string;
  label: string;
  image: string;
  color: string | null;
  units: number;
  orders: number;
  bySize: { size: string; count: number }[];
  accent: string;
};

function rollupProducts(rows: Order[]): ProductCardData[] {
  const map = new Map<string, ProductCardData>();
  const sizeMap = new Map<string, Map<string, number>>();
  for (const o of rows) {
    const key = [o.product, o.variant_type ?? "", o.color ?? ""].join("|");
    let card = map.get(key);
    if (!card) {
      card = {
        key,
        label: [o.variant_type, o.product, o.color && `(${o.color})`]
          .filter(Boolean)
          .join(" "),
        image: imagePathFor({
          product: o.product,
          variantType: o.variant_type,
          color: o.color,
        }),
        color: o.color,
        units: 0,
        orders: 0,
        bySize: [],
        accent: DEFAULT_ACCENT,
      };
      map.set(key, card);
      sizeMap.set(key, new Map());
    }
    card.units += o.quantity ?? 1;
    card.orders += 1;
    const bucket = sizeMap.get(key)!;
    bucket.set(o.size, (bucket.get(o.size) ?? 0) + (o.quantity ?? 1));
  }
  for (const [key, card] of map.entries()) {
    const counts = sizeMap.get(key) ?? new Map();
    card.bySize = SIZE_ORDER.map((size) => ({
      size,
      count: counts.get(size) ?? 0,
    })).filter((entry) => entry.count > 0);
    card.accent = card.color ? COLOR_ACCENT[card.color] ?? DEFAULT_ACCENT : DEFAULT_ACCENT;
  }
  return Array.from(map.values()).sort((a, b) => b.units - a.units);
}

function ProductCard({ product }: { product: ProductCardData }) {
  const maxSize = Math.max(1, ...product.bySize.map((size) => size.count));
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
      style={{ borderColor: `${product.accent}33` }}
    >
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: product.accent }}
      />
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt=""
          className="h-12 w-12 shrink-0 object-contain"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-neutral-900">
            {product.label}
          </p>
          {product.color && (
            <p
              className="mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: `${product.accent}14`,
                color: product.accent,
              }}
            >
              צבע {product.color}
            </p>
          )}
          <p className="text-xs text-neutral-500">{product.orders} הזמנות</p>
        </div>
        <div className="text-left">
          <div className="mb-1 flex items-center justify-end gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: product.accent }}
            />
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-500">
              סה״כ יחידות
            </p>
          </div>
          <p
            className="text-2xl font-semibold tracking-[-0.03em]"
            style={{ color: product.accent }}
          >
            {product.units}
          </p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {product.bySize.map((size) => {
          const meta = SIZE_META[size.size] ?? {
            label: size.size,
            color: "bg-neutral-400",
          };
          const width = `${Math.max(8, (size.count / maxSize) * 100)}%`;
          return (
            <div key={size.size} className="grid grid-cols-[32px_1fr_26px] items-center gap-2">
              <span className="text-[11px] font-medium text-neutral-500">
                {meta.label}
              </span>
              <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={`h-full rounded-full ${meta.color}`}
                  style={{ width }}
                />
              </div>
              <span className="text-right text-[11px] font-medium tabular-nums text-neutral-700">
                {size.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
