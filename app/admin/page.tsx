import { redirect } from "next/navigation";
import { sql, type Order } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { logoutAction } from "@/app/admin/actions";

export const metadata = { title: "ניהול הזמנות" };
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("he-IL", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Asia/Jerusalem",
});

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const orders = (await sql`
    SELECT id, product, variant_type, color, size, customer_name, phone, notes, status, created_at
    FROM orders
    ORDER BY created_at DESC
    LIMIT 500
  `) as Order[];

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-10 md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-medium uppercase tracking-[-0.01em] text-neutral-900">
              הזמנות
            </h1>
            <p className="mt-1 text-xs text-neutral-500">
              {orders.length} הזמנות · מחובר כ־{session.username}
            </p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="cursor-pointer border border-neutral-300 bg-white px-4 py-2 text-[11px] uppercase text-neutral-700 hover:bg-neutral-100"
            >
              התנתקות
            </button>
          </form>
        </div>

        {orders.length === 0 ? (
          <p className="mt-10 text-center text-sm text-neutral-500">
            אין הזמנות עדיין
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto border border-neutral-200 bg-white">
            <table className="w-full text-right text-sm">
              <thead className="bg-neutral-100 text-[11px] uppercase text-neutral-600">
                <tr>
                  <th className="px-3 py-2 font-medium">תאריך</th>
                  <th className="px-3 py-2 font-medium">מוצר</th>
                  <th className="px-3 py-2 font-medium">מידה</th>
                  <th className="px-3 py-2 font-medium">לקוח</th>
                  <th className="px-3 py-2 font-medium">טלפון</th>
                  <th className="px-3 py-2 font-medium">הערות</th>
                  <th className="px-3 py-2 font-medium">סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const productLabel = [o.variant_type, o.product, o.color && `(${o.color})`]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <tr key={o.id} className="border-t border-neutral-200 align-top">
                      <td className="px-3 py-2 text-xs text-neutral-500 whitespace-nowrap">
                        {dateFmt.format(new Date(o.created_at))}
                      </td>
                      <td className="px-3 py-2 text-neutral-900">{productLabel}</td>
                      <td className="px-3 py-2 text-neutral-900">{o.size}</td>
                      <td className="px-3 py-2 text-neutral-900">{o.customer_name}</td>
                      <td className="px-3 py-2 text-neutral-900" dir="ltr">
                        <a className="hover:underline" href={`tel:${o.phone}`}>
                          {o.phone}
                        </a>
                      </td>
                      <td className="px-3 py-2 text-neutral-700 whitespace-pre-wrap">
                        {o.notes ?? ""}
                      </td>
                      <td className="px-3 py-2 text-xs uppercase text-neutral-600">
                        {o.status}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
