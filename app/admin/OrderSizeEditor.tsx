"use client";

import { useState, useTransition } from "react";
import { updateOrderSize } from "@/app/actions/orders";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"] as const;

export function OrderSizeEditor({
  id,
  current,
}: {
  id: string;
  current: string;
}) {
  const [value, setValue] = useState(current);
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    if (next === value) return;
    const prev = value;
    setValue(next);
    const fd = new FormData();
    fd.set("id", id);
    fd.set("size", next);
    startTransition(async () => {
      try {
        await updateOrderSize(fd);
      } catch {
        setValue(prev);
      }
    });
  }

  return (
    <select
      value={value}
      onChange={onChange}
      disabled={pending}
      className="cursor-pointer rounded-xl border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-900 outline-none transition-colors hover:bg-neutral-50 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
      aria-label="עריכת מידה"
    >
      {SIZES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
