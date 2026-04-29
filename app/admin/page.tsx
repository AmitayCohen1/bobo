import { redirect } from "next/navigation";
import { LogOut, Package, ShieldCheck } from "lucide-react";
import { sql, type Order } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { logoutAction } from "@/app/admin/actions";
import { ExportOrdersButton } from "./ExportOrdersButton";
import { AdminAnalyticsPanel } from "./AdminAnalyticsPanel";
import { OrdersView } from "./OrdersView";

export const metadata = { title: "ניהול הזמנות" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const [rows, grouped, bySize, bySource] =
    (await Promise.all([
      sql`
        SELECT id, product, variant_type, color, size, quantity, customer_name, phone, notes, admin_note, heard_from, status, is_waitlist, is_paid, created_at
        FROM orders
        ORDER BY created_at DESC
        LIMIT 500
      `,
      sql`
        SELECT product, variant_type, color, size, is_waitlist,
               COALESCE(SUM(quantity), 0)::int AS count,
               COUNT(*)::int AS orders
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
        SELECT heard_from, COALESCE(SUM(quantity), 0)::int AS count
        FROM orders
        WHERE heard_from IS NOT NULL AND heard_from <> ''
        GROUP BY heard_from
        ORDER BY count DESC
      `,
    ])) as [
      Order[],
      { product: string; variant_type: string | null; color: string | null; size: string; is_waitlist: boolean; count: number; orders: number }[],
      { size: string; count: number }[],
      { heard_from: string; count: number }[],
    ];

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

        <div className="mt-2 space-y-4">
          <AdminAnalyticsPanel
            grouped={grouped as { product: string; variant_type: string | null; color: string | null; size: string; is_waitlist: boolean; count: number; orders: number }[]}
            bySize={bySize as { size: string; count: number }[]}
            bySource={bySource as { heard_from: string; count: number }[]}
          />
          <OrdersView orders={rows} />
        </div>
      </div>
    </main>
  );
}
