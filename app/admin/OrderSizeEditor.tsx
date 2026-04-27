"use client";

import { useState, useTransition } from "react";
import { updateOrderSize } from "@/app/actions/orders";

const SIZES = ["S", "M", "L", "XL"] as const;

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
      className="cursor-pointer rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-xs text-neutral-900 outline-none transition-colors hover:bg-neutral-50 focus:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-60"
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
