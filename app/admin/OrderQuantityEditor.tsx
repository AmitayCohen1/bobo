"use client";

import { useState, useTransition } from "react";
import { updateOrderQuantity } from "@/app/actions/orders";

const QTY_MIN = 1;
const QTY_MAX = 10;

export function OrderQuantityEditor({
  id,
  current,
}: {
  id: string;
  current: number;
}) {
  const [value, setValue] = useState(current);
  const [pending, startTransition] = useTransition();

  function commit(next: number) {
    if (next === value) return;
    const prev = value;
    setValue(next);
    const fd = new FormData();
    fd.set("id", id);
    fd.set("quantity", String(next));
    startTransition(async () => {
      try {
        await updateOrderQuantity(fd);
      } catch {
        setValue(prev);
      }
    });
  }

  const isMulti = value > 1;

  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => commit(Math.max(QTY_MIN, value - 1))}
        disabled={pending || value <= QTY_MIN}
        aria-label="הפחת כמות"
        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-neutral-200 bg-white text-sm leading-none text-neutral-900 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        −
      </button>
      <span
        className={`min-w-[1.25rem] text-center text-xs tabular-nums ${
          isMulti ? "font-bold text-neutral-900" : "text-neutral-500"
        }`}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => commit(Math.min(QTY_MAX, value + 1))}
        disabled={pending || value >= QTY_MAX}
        aria-label="הוסף כמות"
        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-neutral-200 bg-white text-sm leading-none text-neutral-900 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}
