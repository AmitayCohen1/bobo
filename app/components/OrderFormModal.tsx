"use client";

import { useEffect, useRef, useState } from "react";
import { createOrder, type CreateOrderInput } from "@/app/actions/orders";

type Props = {
  open: boolean;
  onClose: () => void;
  order: Omit<CreateOrderInput, "name" | "phone" | "notes"> | null;
};

const errorMessages: Record<string, string> = {
  missing_product: "פרטי המוצר חסרים",
  missing_name: "צריך להזין שם",
  invalid_phone: "מספר טלפון לא תקין",
};

export function OrderFormModal({ open, onClose, order }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setSuccess(false);
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !order) return null;

  const productLabel = [order.variantType, order.product, order.color && `(${order.color})`]
    .filter(Boolean)
    .join(" ");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!order) return;
    setSubmitting(true);
    setError(null);
    const res = await createOrder({
      product: order.product,
      variantType: order.variantType ?? null,
      color: order.color ?? null,
      size: order.size,
      name,
      phone,
      notes: notes || null,
    });
    setSubmitting(false);
    if (res.ok) {
      setSuccess(true);
      setName("");
      setPhone("");
      setNotes("");
      setTimeout(onClose, 1400);
    } else {
      setError(errorMessages[res.error] ?? "משהו השתבש, נסו שוב");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-white p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="סגור"
          className="absolute top-3 left-3 cursor-pointer border-0 bg-transparent text-2xl font-extralight leading-none text-neutral-500 hover:text-neutral-900"
        >
          ×
        </button>
        <h2 className="text-base font-medium uppercase tracking-[-0.01em] text-neutral-900">
          הזמנה
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          {productLabel} · מידה {order.size}
        </p>

        {success ? (
          <div className="mt-6 rounded border border-neutral-200 bg-neutral-50 p-4 text-center text-sm text-neutral-700">
            ההזמנה נשלחה! ניצור איתך קשר בהקדם.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-xs text-neutral-600">
              שם
              <input
                ref={nameRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={120}
                className="h-10 border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-neutral-600">
              טלפון
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                inputMode="tel"
                maxLength={40}
                dir="ltr"
                className="h-10 border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-500 text-right"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-neutral-600">
              הערות (אופציונלי)
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={1000}
                rows={3}
                className="resize-none border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-500"
              />
            </label>
            {error && (
              <p className="text-xs text-red-600" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex h-12 w-full cursor-pointer items-center justify-center bg-brand text-[11px] font-bold uppercase text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "שולח…" : "שליחת הזמנה"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
