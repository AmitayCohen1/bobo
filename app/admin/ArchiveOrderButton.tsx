"use client";

import { useTransition } from "react";
import { Archive, ArchiveRestore } from "lucide-react";
import { updateOrderArchived } from "@/app/actions/orders";

export function ArchiveOrderButton({
  id,
  label,
  archived,
  variant = "icon",
}: {
  id: string;
  label: string;
  archived: boolean;
  variant?: "icon" | "full";
}) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    const message = archived
      ? `להחזיר מהארכיון את ההזמנה של ${label}?`
      : `להעביר לארכיון את ההזמנה של ${label}?`;
    if (!confirm(message)) return;
    const fd = new FormData();
    fd.set("id", id);
    fd.set("archived", archived ? "false" : "true");
    startTransition(() => {
      updateOrderArchived(fd);
    });
  }

  const Icon = archived ? ArchiveRestore : Archive;
  const title = archived ? "החזר מהארכיון" : "העבר לארכיון";

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-label={title}
        className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-medium text-neutral-600 transition-colors hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        {pending ? "…" : title}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label={title}
      title={title}
      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} />
    </button>
  );
}
