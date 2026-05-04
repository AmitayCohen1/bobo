"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteOrder } from "@/app/actions/orders";

export function DeleteOrderButton({
  id,
  label,
  variant = "icon",
  action = deleteOrder,
  confirmText,
}: {
  id: string;
  label: string;
  variant?: "icon" | "full";
  action?: (formData: FormData) => Promise<void>;
  confirmText?: (label: string) => string;
}) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    const message = confirmText
      ? confirmText(label)
      : `למחוק את ההזמנה של ${label}?`;
    if (!confirm(message)) return;
    const fd = new FormData();
    fd.set("id", id);
    startTransition(() => {
      action(fd);
    });
  }

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-label="מחיקה"
        className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-medium text-neutral-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
        {pending ? "מוחק…" : "מחיקה"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label="מחיקה"
      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
    </button>
  );
}
