"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Pencil, NotebookPen, Check, X } from "lucide-react";

const MAX = 2000;

export function AdminNoteEditor({
  id,
  initialNote,
  action,
}: {
  id: string;
  initialNote: string | null;
  action: (formData: FormData) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialNote ?? "");
  const [pending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    }
  }, [editing]);

  function open() {
    setDraft(initialNote ?? "");
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setDraft(initialNote ?? "");
  }

  function save() {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("admin_note", draft);
    startTransition(async () => {
      await action(fd);
      setEditing(false);
    });
  }

  if (!editing) {
    if (!initialNote) {
      return (
        <button
          type="button"
          onClick={open}
          aria-label="הוספת הערה"
          title="הוספת הערה"
          className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-dashed border-amber-300 bg-amber-50/50 text-amber-700 transition-colors hover:bg-amber-50"
        >
          <NotebookPen className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={open}
        className="group flex w-full cursor-pointer items-start gap-1.5 rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-right text-[12px] text-amber-900 transition-colors hover:bg-amber-100"
        title="לחץ לעריכה"
      >
        <NotebookPen
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600"
          strokeWidth={1.75}
        />
        <span className="flex-1 whitespace-pre-wrap break-words">
          {initialNote}
        </span>
        <Pencil
          className="mt-0.5 h-3 w-3 shrink-0 text-amber-500 opacity-0 transition-opacity group-hover:opacity-100"
          strokeWidth={1.75}
        />
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 rounded border border-amber-300 bg-amber-50 p-2">
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value.slice(0, MAX))}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            save();
          }
        }}
        disabled={pending}
        rows={3}
        placeholder="הערה לעצמי…"
        className="w-full resize-y rounded border border-amber-200 bg-white px-2 py-1.5 text-right text-[12px] text-neutral-900 outline-none placeholder:text-amber-400 focus:border-amber-400 disabled:opacity-60"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-amber-700">
          {draft.length}/{MAX}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={cancel}
            disabled={pending}
            className="inline-flex cursor-pointer items-center gap-1 rounded border border-neutral-200 bg-white px-2 py-1 text-[11px] text-neutral-600 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-3 w-3" strokeWidth={2} />
            ביטול
          </button>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="inline-flex cursor-pointer items-center gap-1 rounded border border-amber-500 bg-amber-500 px-2 py-1 text-[11px] text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="h-3 w-3" strokeWidth={2.5} />
            {pending ? "שומר…" : "שמירה"}
          </button>
        </div>
      </div>
    </div>
  );
}
