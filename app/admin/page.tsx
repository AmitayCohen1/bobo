import { redirect } from "next/navigation";
import { LogOut, Package } from "lucide-react";
import { sql, type Order } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { logoutAction } from "@/app/admin/actions";
import { ExportOrdersButton } from "./ExportOrdersButton";
import { TabNav } from "./TabNav";
import { OrdersView } from "./OrdersView";

export const metadata = { title: "ניהול הזמנות" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const rows = (await sql`
    SELECT id, product, variant_type, color, size, quantity, customer_name, phone, notes, admin_note, heard_from, status, is_waitlist, created_at
    FROM orders
    ORDER BY created_at DESC
    LIMIT 500
  `) as Order[];

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  const sumQty = (rs: Order[]) =>
    rs.reduce((acc, o) => acc + (o.quantity ?? 1), 0);
  const totalCount = sumQty(rows);
  const weekCount = sumQty(
    rows.filter((o) => new Date(o.created_at) >= startOfWeek)
  );
  const todayCount = sumQty(
    rows.filter((o) => new Date(o.created_at) >= startOfToday)
  );

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
                הזמנות
              </h1>
              <p className="text-xs text-neutral-500">
                בובו · מחובר כ־{session.username}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <ExportOrdersButton orders={rows} />
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded border border-neutral-300 bg-white px-3 py-2 text-[11px] uppercase tracking-wide text-neutral-700 transition-colors hover:bg-neutral-100 sm:w-auto"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
                התנתקות
              </button>
            </form>
          </div>
        </header>

        <TabNav current="orders" />

        <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          <Stat label="סה״כ פריטים" value={totalCount} />
          <Stat label="פריטים השבוע" value={weekCount} accent="emerald" />
          <Stat label="פריטים היום" value={todayCount} />
        </div>

        <OrdersView orders={rows} />
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
  accent?: "emerald";
}) {
  const valueColor =
    accent === "emerald" ? "text-emerald-700" : "text-neutral-900";
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
