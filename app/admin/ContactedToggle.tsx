"use client";

import { useTransition } from "react";
import { updateWaitlistContacted } from "@/app/actions/waitlist";

export function ContactedToggle({
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
    fd.set("contacted", next ? "true" : "false");
    startTransition(async () => {
      await updateWaitlistContacted(fd);
    });
  }

  return (
    <label
      title={initial ? "יצרנו קשר" : "טרם יצרנו קשר"}
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
      {initial && <span aria-hidden="true">📞</span>}
    </label>
  );
}
