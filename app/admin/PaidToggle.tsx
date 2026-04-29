"use client";

import { useTransition } from "react";
import { updateOrderIsPaid } from "@/app/actions/orders";

export function PaidToggle({
  id,
  initial,
}: {
  id: string;
  initial: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function onChange(next: boolean) {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("is_paid", next ? "true" : "false");
    startTransition(async () => {
      await updateOrderIsPaid(fd);
    });
  }

  return (
    <label
      title={initial ? "שולם" : "לא שולם"}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-medium transition-colors ${
        initial
          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
          : "border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50"
      } ${pending ? "opacity-60" : ""}`}
    >
      <input
        type="checkbox"
        checked={initial}
        disabled={pending}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 cursor-pointer accent-emerald-600 disabled:cursor-not-allowed"
      />
      <span>{initial ? "שולם" : "לא שולם"}</span>
    </label>
  );
}
