"use client";

import { useTransition } from "react";
import { updateOrderIsPacked } from "@/app/actions/orders";

export function PackedToggle({
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
    fd.set("is_packed", next ? "true" : "false");
    startTransition(async () => {
      await updateOrderIsPacked(fd);
    });
  }

  return (
    <label
      title={initial ? "ארוז" : "לא ארוז"}
      className={`inline-flex cursor-pointer items-center gap-1 ${
        pending ? "opacity-60" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={initial}
        disabled={pending}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 cursor-pointer accent-sky-600 disabled:cursor-not-allowed"
      />
      {initial && <span aria-hidden="true">📦</span>}
    </label>
  );
}
