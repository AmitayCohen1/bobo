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
      className={`inline-flex cursor-pointer items-center gap-1 ${
        pending ? "opacity-60" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={initial}
        disabled={pending}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 cursor-pointer accent-emerald-600 disabled:cursor-not-allowed"
      />
      {initial && <span aria-hidden="true">💰</span>}
    </label>
  );
}
