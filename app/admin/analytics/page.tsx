import { redirect } from "next/navigation";
import { LogOut, Package } from "lucide-react";
import { sql } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { logoutAction } from "@/app/admin/actions";
import { TabNav } from "../TabNav";

export const metadata = { title: "אנליטיקה · בובו" };
export const dynamic = "force-dynamic";

type GroupedItem = {
  product: string;
  variant_type: string | null;
  color: string | null;
  size: string;
  count: number;
};
type SizeCount = { size: string; count: number };
type DailyCount = { day: string; count: number };
type SourceCount = { heard_from: string; count: number };
type SingleCount = { count: number };

function itemLabel(o: {
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

function fillDays(rows: DailyCount[], days = 30): { day: string; count: number; label: string }[] {
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

export default async function AnalyticsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const [grouped, bySize, daily, bySource, total, weekRow, monthRow] = (await Promise.all([
    sql`
      SELECT product, variant_type, color, size, COUNT(*)::int AS count
      FROM orders
      GROUP BY product, variant_type, color, size
      ORDER BY count DESC
    `,
    sql`
      SELECT size, COUNT(*)::int AS count
      FROM orders
      GROUP BY size
      ORDER BY count DESC
    `,
    sql`
      SELECT to_char(date_trunc('day', created_at AT TIME ZONE 'Asia/Jerusalem'), 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY day
      ORDER BY day
    `,
    sql`
      SELECT heard_from, COUNT(*)::int AS count
      FROM orders
      WHERE heard_from IS NOT NULL AND heard_from <> ''
      GROUP BY heard_from
      ORDER BY count DESC
    `,
    sql`SELECT COUNT(*)::int AS count FROM orders`,
    sql`SELECT COUNT(*)::int AS count FROM orders WHERE created_at >= NOW() - INTERVAL '7 days'`,
    sql`SELECT COUNT(*)::int AS count FROM orders WHERE created_at >= NOW() - INTERVAL '30 days'`,
  ])) as [
    GroupedItem[],
    SizeCount[],
    DailyCount[],
    SourceCount[],
    SingleCount[],
    SingleCount[],
    SingleCount[],
  ];

  const totalCount = total[0]?.count ?? 0;
  const weekCount = weekRow[0]?.count ?? 0;
  const monthCount = monthRow[0]?.count ?? 0;
  const groupedTotal = grouped.reduce((sum, r) => sum + r.count, 0);
  const sizeTotal = bySize.reduce((sum, r) => sum + r.count, 0);
  const sourceTotal = bySource.reduce((sum, r) => sum + r.count, 0);
  const days = fillDays(daily);
  const dailyMax = Math.max(1, ...days.map((d) => d.count));

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

        <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          <Stat label="סה״כ" value={totalCount} />
          <Stat label="7 ימים" value={weekCount} accent="emerald" />
          <Stat label="30 ימים" value={monthCount} />
        </div>

        <Section title="הזמנות לפי יום (30 ימים)">
          {totalCount === 0 ? (
            <Empty />
          ) : (
            <div className="rounded border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex h-32 items-end gap-1" dir="ltr">
                {days.map((d) => {
                  const h = (d.count / dailyMax) * 100;
                  return (
                    <div
                      key={d.day}
                      className="group relative flex flex-1 flex-col items-center justify-end"
                      title={`${d.label} · ${d.count}`}
                    >
                      <div
                        className={`w-full rounded-sm ${
                          d.count > 0 ? "bg-emerald-500" : "bg-neutral-100"
                        }`}
                        style={{ height: `${Math.max(h, 2)}%` }}
                      />
                    </div>
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

        <Section title="פילוח מוצרים ומידות">
          {grouped.length === 0 ? (
            <Empty />
          ) : (
            <div className="overflow-hidden rounded border border-neutral-200 bg-white shadow-sm">
              <table className="w-full text-right text-sm">
                <thead className="bg-neutral-50 text-[11px] uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">מוצר</th>
                    <th className="px-4 py-3 font-medium">מידה</th>
                    <th className="px-4 py-3 font-medium">כמות</th>
                    <th className="px-4 py-3 font-medium">%</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped.map((g, i) => {
                    const pct = groupedTotal > 0 ? (g.count / groupedTotal) * 100 : 0;
                    return (
                      <tr
                        key={`${g.product}|${g.variant_type ?? ""}|${g.color ?? ""}|${g.size}|${i}`}
                        className="border-t border-neutral-200"
                      >
                        <td className="px-4 py-3 text-neutral-900">{itemLabel(g)}</td>
                        <td className="px-4 py-3 text-neutral-700">{g.size}</td>
                        <td className="px-4 py-3 font-medium text-neutral-900">
                          {g.count}
                        </td>
                        <td className="px-4 py-3 text-neutral-500">
                          <div className="flex items-center gap-2" dir="ltr">
                            <div className="h-1.5 w-24 rounded bg-neutral-100">
                              <div
                                className="h-full rounded bg-emerald-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[11px]">{pct.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <Section title="התפלגות לפי מידה">
          {bySize.length === 0 ? (
            <Empty />
          ) : (
            <div className="rounded border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3">
                {bySize.map((s) => {
                  const pct = sizeTotal > 0 ? (s.count / sizeTotal) * 100 : 0;
                  return (
                    <div key={s.size} className="flex items-center gap-3">
                      <span className="w-10 text-sm font-medium text-neutral-900">
                        {s.size}
                      </span>
                      <div className="h-2.5 flex-1 rounded bg-neutral-100" dir="ltr">
                        <div
                          className="h-full rounded bg-neutral-900"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-14 text-left text-xs text-neutral-700">
                        {s.count} · {pct.toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Section>

        <Section title="מאיפה הגיעו (heard_from)">
          {bySource.length === 0 ? (
            <Empty msg="עוד אין נתונים" />
          ) : (
            <div className="rounded border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3">
                {bySource.map((s) => {
                  const pct = sourceTotal > 0 ? (s.count / sourceTotal) * 100 : 0;
                  return (
                    <div key={s.heard_from} className="flex items-center gap-3">
                      <span className="w-32 truncate text-sm text-neutral-900">
                        {s.heard_from}
                      </span>
                      <div className="h-2.5 flex-1 rounded bg-neutral-100" dir="ltr">
                        <div
                          className="h-full rounded bg-sky-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-14 text-left text-xs text-neutral-700">
                        {s.count} · {pct.toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
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

function Empty({ msg = "אין נתונים" }: { msg?: string }) {
  return (
    <div className="rounded border border-dashed border-neutral-300 bg-white px-6 py-10 text-center">
      <p className="text-xs text-neutral-500">{msg}</p>
    </div>
  );
}
