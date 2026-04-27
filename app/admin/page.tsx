import { redirect } from "next/navigation";
import { Clock, LogOut, Package, Phone, StickyNote, User } from "lucide-react";
import { sql, type Order, type WaitlistEntry } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { logoutAction } from "@/app/admin/actions";
import { updateWaitlistAdminNote } from "@/app/actions/waitlist";
import { DeleteWaitlistButton } from "./DeleteWaitlistButton";
import { AdminNoteEditor } from "./AdminNoteEditor";
import { ExportOrdersButton } from "./ExportOrdersButton";
import { TabNav } from "./TabNav";
import { OrdersView } from "./OrdersView";
import { WaitlistSizeEditor } from "./WaitlistSizeEditor";
import { WaitlistQuantityEditor } from "./WaitlistQuantityEditor";

export const metadata = { title: "ניהול הזמנות" };
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("he-IL", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jerusalem",
});

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const [orders, waitlist] = (await Promise.all([
    sql`
      SELECT id, product, variant_type, color, size, quantity, customer_name, phone, notes, admin_note, heard_from, status, created_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT 500
    `,
    sql`
      SELECT id, product, size, quantity, customer_name, phone, notes, admin_note, status, created_at
      FROM waitlist
      ORDER BY created_at DESC
      LIMIT 500
    `,
  ])) as [Order[], WaitlistEntry[]];

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  const sumQty = (rows: Order[]) =>
    rows.reduce((acc, o) => acc + (o.quantity ?? 1), 0);
  const totalCount = sumQty(orders);
  const weekCount = sumQty(
    orders.filter((o) => new Date(o.created_at) >= startOfWeek)
  );
  const todayCount = sumQty(
    orders.filter((o) => new Date(o.created_at) >= startOfToday)
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
            <ExportOrdersButton orders={orders} />
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
          <Stat label="סה״כ" value={totalCount} />
          <Stat label="השבוע" value={weekCount} accent="emerald" />
          <Stat label="היום" value={todayCount} />
        </div>

        <OrdersView orders={orders} />

        <div className="mt-12">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-neutral-500" strokeWidth={1.75} />
            <h2 className="text-sm font-medium tracking-[-0.01em] text-neutral-900">
              רשימת המתנה
            </h2>
            <span className="text-[11px] text-neutral-500">({waitlist.length})</span>
          </div>

          {waitlist.length === 0 ? (
            <div className="mt-4 flex flex-col items-center justify-center rounded border border-dashed border-neutral-300 bg-white px-6 py-10 text-center">
              <p className="text-xs text-neutral-500">אין רישומים ברשימת המתנה</p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <ul className="mt-4 flex flex-col gap-3 md:hidden">
                {waitlist.map((w) => (
                  <li
                    key={w.id}
                    className="rounded border border-neutral-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] text-neutral-500">
                          {dateFmt.format(new Date(w.created_at))}
                        </span>
                        <p className="mt-1 text-sm font-medium text-neutral-900">
                          {w.product}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                          <div className="flex items-center gap-1.5">
                            <span>מידה</span>
                            <WaitlistSizeEditor id={w.id} current={w.size} />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span>כמות</span>
                            <WaitlistQuantityEditor id={w.id} current={w.quantity} />
                          </div>
                        </div>
                      </div>
                      <DeleteWaitlistButton id={w.id} label={w.customer_name} />
                    </div>
                    <div className="mt-3 flex flex-col gap-1.5 border-t border-neutral-100 pt-3 text-sm">
                      <p className="flex items-center gap-2 text-neutral-700">
                        <User className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.75} />
                        {w.customer_name}
                      </p>
                      <a
                        href={`tel:${w.phone}`}
                        dir="ltr"
                        className="flex items-center gap-2 text-neutral-700 hover:text-neutral-900"
                      >
                        <Phone className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.75} />
                        <span>{w.phone}</span>
                      </a>
                      {w.notes && (
                        <p className="flex items-start gap-2 whitespace-pre-wrap text-neutral-700">
                          <StickyNote
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400"
                            strokeWidth={1.75}
                          />
                          <span>{w.notes}</span>
                        </p>
                      )}
                      <div className="mt-1">
                        <AdminNoteEditor
                          id={w.id}
                          initialNote={w.admin_note}
                          action={updateWaitlistAdminNote}
                        />
                      </div>
                    </div>
                  </li>
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
                        <th className="px-4 py-3 font-medium">כמות</th>
                        <th className="px-4 py-3 font-medium">לקוח</th>
                        <th className="px-4 py-3 font-medium">טלפון</th>
                        <th className="px-4 py-3 font-medium">הערות</th>
                        <th className="px-4 py-3 font-medium">הערה לעצמי</th>
                        <th className="px-4 py-3 font-medium" />
                      </tr>
                    </thead>
                    <tbody>
                      {waitlist.map((w) => (
                        <tr
                          key={w.id}
                          className="border-t border-neutral-200 align-top transition-colors hover:bg-neutral-50"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-500">
                            {dateFmt.format(new Date(w.created_at))}
                          </td>
                          <td className="px-4 py-3 text-neutral-900">{w.product}</td>
                          <td className="px-4 py-3 text-neutral-900">
                            <WaitlistSizeEditor id={w.id} current={w.size} />
                          </td>
                          <td className="px-4 py-3 text-neutral-900">
                            <WaitlistQuantityEditor id={w.id} current={w.quantity} />
                          </td>
                          <td className="px-4 py-3 text-neutral-900">{w.customer_name}</td>
                          <td className="px-4 py-3 text-neutral-900" dir="ltr">
                            <a
                              href={`tel:${w.phone}`}
                              className="inline-flex items-center gap-1.5 text-neutral-700 hover:text-neutral-900"
                            >
                              <Phone
                                className="h-3.5 w-3.5 text-neutral-400"
                                strokeWidth={1.75}
                              />
                              <span>{w.phone}</span>
                            </a>
                          </td>
                          <td className="max-w-xs whitespace-pre-wrap px-4 py-3 text-neutral-700">
                            {w.notes ? (
                              <span className="inline-flex items-start gap-1.5">
                                <StickyNote
                                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400"
                                  strokeWidth={1.75}
                                />
                                <span>{w.notes}</span>
                              </span>
                            ) : (
                              <span className="text-neutral-300">—</span>
                            )}
                          </td>
                          <td className="max-w-xs px-4 py-3 align-top">
                            <AdminNoteEditor
                              id={w.id}
                              initialNote={w.admin_note}
                              action={updateWaitlistAdminNote}
                            />
                          </td>
                          <td className="px-2 py-3 text-left">
                            <DeleteWaitlistButton
                              id={w.id}
                              label={w.customer_name}
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

