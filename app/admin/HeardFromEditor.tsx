"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Megaphone, Plus, X } from "lucide-react";
import { updateOrderHeardFrom } from "@/app/actions/orders";

const MAX = 80;
const BOBO = "בובו";

type Mode = "" | "בובו" | "אחר";

function modeFromValue(value: string | null): Mode {
  if (!value) return "";
  if (value === BOBO) return BOBO;
  return "אחר";
}

export function HeardFromEditor({
  id,
  initial,
}: {
  id: string;
  initial: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [mode, setMode] = useState<Mode>(modeFromValue(initial));
  const [otherText, setOtherText] = useState(
    initial && initial !== BOBO ? initial : ""
  );
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && mode === "אחר") {
      const el = inputRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    }
  }, [editing, mode]);

  function open() {
    setMode(modeFromValue(initial));
    setOtherText(initial && initial !== BOBO ? initial : "");
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setMode(modeFromValue(initial));
    setOtherText(initial && initial !== BOBO ? initial : "");
  }

  function commit(value: string) {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("heard_from", value);
    startTransition(async () => {
      await updateOrderHeardFrom(fd);
      setEditing(false);
    });
  }

  function pickBobo() {
    setMode(BOBO);
    commit(BOBO);
  }

  function saveOther() {
    const trimmed = otherText.trim();
    if (!trimmed) return;
    commit(trimmed);
  }

  if (editing) {
    return (
      <div className="inline-flex flex-col gap-1.5 rounded-2xl border border-sky-300 bg-white p-2 shadow-sm">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={pickBobo}
            disabled={pending}
            className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              mode === BOBO
                ? "border-sky-500 bg-sky-500 text-white"
                : "border-sky-200 bg-white text-sky-700 hover:bg-sky-50"
            }`}
          >
            {BOBO}
          </button>
          <button
            type="button"
            onClick={() => setMode("אחר")}
            disabled={pending}
            className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              mode === "אחר"
                ? "border-sky-500 bg-sky-500 text-white"
                : "border-sky-200 bg-white text-sky-700 hover:bg-sky-50"
            }`}
          >
            אחר
          </button>
          <button
            type="button"
            onClick={cancel}
            disabled={pending}
            aria-label="ביטול"
            className="ms-auto flex h-6 w-6 cursor-pointer items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-3 w-3" strokeWidth={2} />
          </button>
        </div>
        {mode === "אחר" && (
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              value={otherText}
              onChange={(e) => setOtherText(e.target.value.slice(0, MAX))}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  cancel();
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  saveOther();
                }
              }}
              disabled={pending}
              maxLength={MAX}
              placeholder="פירוט"
              className="h-8 w-36 rounded-xl border border-sky-200 bg-white px-2 text-[11px] text-neutral-900 outline-none placeholder:text-sky-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={saveOther}
              disabled={pending || !otherText.trim()}
              aria-label="שמור"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-sky-500 text-white transition-colors hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check className="h-3 w-3" strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!initial) {
      return (
      <button
        type="button"
        onClick={open}
        className="inline-flex w-fit cursor-pointer items-center gap-1 rounded-full border border-dashed border-sky-300 bg-sky-50/50 px-2.5 py-1 text-[10px] font-medium text-sky-700 transition-colors hover:bg-sky-50"
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
      className="inline-flex w-fit cursor-pointer items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-medium text-sky-700 transition-colors hover:bg-sky-100"
    >
      <Megaphone className="h-3 w-3" strokeWidth={1.75} />
      {initial}
    </button>
  );
}
