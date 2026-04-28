import Link from "next/link";

export function TabNav({ current }: { current: "orders" | "analytics" }) {
  return (
    <nav className="inline-flex w-fit gap-1 rounded-2xl border border-neutral-200 bg-white p-0.5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <TabLink href="/admin" active={current === "orders"}>
        הזמנות
      </TabLink>
      <TabLink href="/admin/analytics" active={current === "analytics"}>
        אנליטיקה
      </TabLink>
    </nav>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  const base =
    "inline-flex items-center rounded-xl px-3.5 py-1.5 text-sm font-medium transition-colors";
  const cls = active
    ? `${base} bg-neutral-950 text-white shadow-sm`
    : `${base} text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900`;
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
