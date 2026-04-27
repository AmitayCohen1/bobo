"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Megaphone, Plus, X } from "lucide-react";
import { updateOrderHeardFrom } from "@/app/actions/orders";

const MAX = 80;

export function HeardFromEditor({
  id,
  initial,
}: {
  id: string;
  initial: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initial ?? "");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      const el = inputRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    }
  }, [editing]);

  function open() {
    setDraft(initial ?? "");
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setDraft(initial ?? "");
  }

  function save() {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("heard_from", draft.trim());
    startTransition(async () => {
      await updateOrderHeardFrom(fd);
      setEditing(false);
    });
  }

  if (editing) {
    return (
      <div className="inline-flex items-center gap-1 rounded border border-sky-300 bg-white p-0.5">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX))}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            } else if (e.key === "Enter") {
              e.preventDefault();
              save();
            }
          }}
          disabled={pending}
          maxLength={MAX}
          placeholder="מקור"
          className="h-6 w-28 rounded bg-white px-1.5 text-[11px] text-neutral-900 outline-none placeholder:text-sky-400 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={save}
          disabled={pending}
          aria-label="שמור"
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded bg-sky-500 text-white transition-colors hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Check className="h-3 w-3" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={pending}
          aria-label="ביטול"
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-3 w-3" strokeWidth={2} />
        </button>
      </div>
    );
  }

  if (!initial) {
    return (
      <button
        type="button"
        onClick={open}
        className="inline-flex w-fit cursor-pointer items-center gap-1 rounded-full border border-dashed border-sky-300 bg-sky-50/50 px-2 py-0.5 text-[10px] text-sky-700 transition-colors hover:bg-sky-50"
      >
        <Plus className="h-3 w-3" strokeWidth={2} />
        מקור
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={open}
      title="לחץ לעריכה"
      className="inline-flex w-fit cursor-pointer items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] text-sky-700 transition-colors hover:bg-sky-100"
    >
      <Megaphone className="h-3 w-3" strokeWidth={1.75} />
      {initial}
    </button>
  );
}
