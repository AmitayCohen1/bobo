"use client";

import { useTransition } from "react";
import { updateOrderIsCollected } from "@/app/actions/orders";

export function CollectedToggle({
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
    fd.set("is_collected", next ? "true" : "false");
    startTransition(async () => {
      await updateOrderIsCollected(fd);
    });
  }

  return (
    <label
      title={initial ? "נאסף" : "לא נאסף"}
      className={`inline-flex cursor-pointer items-center gap-1 ${
        pending ? "opacity-60" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={initial}
        disabled={pending}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 cursor-pointer accent-violet-600 disabled:cursor-not-allowed"
      />
      {initial && <span aria-hidden="true">✅</span>}
    </label>
  );
}
