"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteWaitlistEntry } from "@/app/actions/waitlist";

export function DeleteWaitlistButton({
  id,
  label,
}: {
  id: string;
  label: string;
}) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm(`למחוק את הרישום של ${label}?`)) return;
    const fd = new FormData();
    fd.set("id", id);
    startTransition(() => {
      deleteWaitlistEntry(fd);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label="מחיקה"
      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
    </button>
  );
}
