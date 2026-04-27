import Link from "next/link";

export function TabNav({ current }: { current: "orders" | "analytics" }) {
  return (
    <nav className="mt-6 flex gap-1 border-b border-neutral-200">
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
    "inline-flex items-center px-3 py-2 text-sm transition-colors -mb-px border-b-2";
  const cls = active
    ? `${base} border-neutral-900 font-medium text-neutral-900`
    : `${base} border-transparent text-neutral-500 hover:text-neutral-900`;
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
