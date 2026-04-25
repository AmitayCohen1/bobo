import { redirect } from "next/navigation";
import { Inbox, LogOut, Package, Phone, StickyNote, User } from "lucide-react";
import { sql, type Order } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { logoutAction } from "@/app/admin/actions";
import { DeleteOrderButton } from "./DeleteOrderButton";

export const metadata = { title: "ניהול הזמנות" };
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("he-IL", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Asia/Jerusalem",
});

function productLabel(o: Order) {
  return [o.variant_type, o.product, o.color && `(${o.color})`]
    .filter(Boolean)
    .join(" ");
}

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const orders = (await sql`
    SELECT id, product, variant_type, color, size, customer_name, phone, notes, status, created_at
    FROM orders
    ORDER BY created_at DESC
    LIMIT 500
  `) as Order[];

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const totalCount = orders.length;
  const newCount = orders.filter((o) => o.status === "new").length;
  const todayCount = orders.filter(
    (o) => new Date(o.created_at) >= startOfToday
  ).length;

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

        <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          <Stat label="סה״כ" value={totalCount} />
          <Stat label="חדשות" value={newCount} accent="emerald" />
          <Stat label="היום" value={todayCount} />
        </div>

        {orders.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
            <Inbox className="h-8 w-8 text-neutral-400" strokeWidth={1.5} />
            <p className="mt-3 text-sm text-neutral-500">אין הזמנות עדיין</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <ul className="mt-6 flex flex-col gap-3 md:hidden">
              {orders.map((o) => (
                <OrderCard key={o.id} order={o} />
              ))}
            </ul>

            {/* Desktop table */}
            <div className="mt-6 hidden overflow-hidden rounded border border-neutral-200 bg-white shadow-sm md:block">
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
                      <th className="px-4 py-3 font-medium">סטטוס</th>
                      <th className="px-4 py-3 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr
                        key={o.id}
                        className="border-t border-neutral-200 align-top transition-colors hover:bg-neutral-50"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-500">
                          {dateFmt.format(new Date(o.created_at))}
                        </td>
                        <td className="px-4 py-3 text-neutral-900">
                          {productLabel(o)}
                        </td>
                        <td className="px-4 py-3 text-neutral-900">{o.size}</td>
                        <td className="px-4 py-3 text-neutral-900">
                          {o.customer_name}
                        </td>
                        <td className="px-4 py-3 text-neutral-900" dir="ltr">
                          <a
                            href={`tel:${o.phone}`}
                            className="inline-flex items-center gap-1.5 text-neutral-700 hover:text-neutral-900"
                          >
                            <Phone
                              className="h-3.5 w-3.5 text-neutral-400"
                              strokeWidth={1.75}
                            />
                            <span>{o.phone}</span>
                          </a>
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
                        <td className="px-4 py-3">
                          <StatusBadge status={o.status} />
                        </td>
                        <td className="px-2 py-3 text-left">
                          <DeleteOrderButton
                            id={o.id}
                            label={o.customer_name}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
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

function StatusBadge({ status }: { status: string }) {
  const isNew = status === "new";
  const styles = isNew
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-neutral-100 text-neutral-600 border-neutral-200";
  const dot = isNew ? "bg-emerald-500" : "bg-neutral-400";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${styles}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
}

function OrderCard({ order: o }: { order: Order }) {
  return (
    <li className="rounded border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <StatusBadge status={o.status} />
            <span className="text-[11px] text-neutral-500">
              {dateFmt.format(new Date(o.created_at))}
            </span>
          </div>
          <p className="mt-2 text-sm font-medium text-neutral-900">
            {productLabel(o)}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">מידה {o.size}</p>
        </div>
        <DeleteOrderButton id={o.id} label={o.customer_name} />
      </div>
      <div className="mt-3 flex flex-col gap-1.5 border-t border-neutral-100 pt-3 text-sm">
        <p className="flex items-center gap-2 text-neutral-700">
          <User className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.75} />
          {o.customer_name}
        </p>
        <a
          href={`tel:${o.phone}`}
          dir="ltr"
          className="flex items-center gap-2 text-neutral-700 hover:text-neutral-900"
        >
          <Phone className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.75} />
          <span>{o.phone}</span>
        </a>
        {o.notes && (
          <p className="flex items-start gap-2 whitespace-pre-wrap text-neutral-700">
            <StickyNote
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400"
              strokeWidth={1.75}
            />
            <span>{o.notes}</span>
          </p>
        )}
      </div>
    </li>
  );
}
