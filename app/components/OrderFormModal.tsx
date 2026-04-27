"use client";

import { useEffect, useRef, useState } from "react";
import { createOrder, type CreateOrderInput } from "@/app/actions/orders";
import { imagePathFor } from "@/lib/product-image";

type Mode = "order" | "waitlist";

type Props = {
  open: boolean;
  onClose: () => void;
  order: Omit<CreateOrderInput, "name" | "phone" | "notes" | "isWaitlist"> | null;
  mode?: Mode;
};

const errorMessages: Record<string, string> = {
  missing_product: "פרטי המוצר חסרים",
  missing_name: "צריך להזין שם",
  invalid_phone: "מספר טלפון לא תקין",
  missing_heard_from: "צריך לציין מאיפה הגעת",
};

export function OrderFormModal({ open, onClose, order, mode = "order" }: Props) {
  const isWaitlist = mode === "waitlist";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [heardFromSource, setHeardFromSource] = useState<"" | "בובו" | "אחר">("");
  const [heardFromOther, setHeardFromOther] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setSuccess(false);
      setQuantity(1);
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
    const heardFrom =
      heardFromSource === "בובו"
        ? "בובו"
        : heardFromSource === "אחר"
          ? heardFromOther.trim() || null
          : null;
    if (!heardFrom) {
      setError(errorMessages.missing_heard_from);
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await createOrder({
      product: order.product,
      variantType: order.variantType ?? null,
      color: order.color ?? null,
      size: order.size,
      quantity,
      name,
      phone,
      notes: notes || null,
      heardFrom,
      isWaitlist,
    });
    setSubmitting(false);
    if (res.ok) {
      setSuccess(true);
      setName("");
      setPhone("");
      setNotes("");
      setHeardFromSource("");
      setHeardFromOther("");
      setTimeout(onClose, 3200);
    } else {
      setError(errorMessages[res.error] ?? "משהו השתבש, נסו שוב");
    }
  }

  const QTY_MIN = 1;
  const QTY_MAX = 10;

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
          {isWaitlist ? "רשימת המתנה" : "הזמנה"}
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          {productLabel} · מידה {order.size}
        </p>
        {isWaitlist && (
          <p className="mt-3 text-xs leading-relaxed text-neutral-600">
            החולצה אזלה — נשאיר אותך מעודכן ברגע שמלאי חדש יגיע.
          </p>
        )}

        {success ? (
          <div className="mt-6 flex flex-col items-center gap-3 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePathFor(order)}
              alt={productLabel}
              className="h-44 w-auto object-contain animate-shirt-pop"
            />
            <h3 className="text-base font-bold uppercase tracking-[-0.01em] text-neutral-900">
              {isWaitlist ? "נרשמת לרשימת המתנה" : "ההזמנה אושרה"}
            </h3>
            <p className="text-xs text-neutral-600">
              {productLabel} · מידה {order.size}
              {quantity > 1 ? ` · ×${quantity}` : ""}
            </p>
            <p className="text-xs text-neutral-500">
              {isWaitlist ? "ניצור איתך קשר ברגע שיהיה מלאי" : "ניצור איתך קשר בהקדם"}
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 border-b border-neutral-100 pb-3">
              <span className="text-xs text-neutral-600">כמות</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(QTY_MIN, q - 1))}
                  disabled={quantity <= QTY_MIN}
                  aria-label="הפחת כמות"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center border border-neutral-200 bg-white text-base leading-none text-neutral-900 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  −
                </button>
                <span
                  aria-live="polite"
                  className="min-w-[1.5rem] text-center text-sm font-bold tabular-nums text-neutral-900"
                >
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(QTY_MAX, q + 1))}
                  disabled={quantity >= QTY_MAX}
                  aria-label="הוסף כמות"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center border border-neutral-200 bg-white text-base leading-none text-neutral-900 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>
            <label className="flex flex-col gap-1 text-xs text-neutral-600">
              שם מלא
              <input
                ref={nameRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={120}
                placeholder="שם פרטי ושם משפחה"
                className="h-10 border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-500"
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
            <div className="flex flex-col gap-1.5 text-xs text-neutral-600">
              <span>מאיפה הגעת אלינו?</span>
              <div className="grid w-full grid-cols-2 gap-px border border-neutral-200 bg-neutral-200">
                {(["בובו", "אחר"] as const).map((opt) => (
                  <label
                    key={opt}
                    className="flex cursor-pointer items-center justify-center bg-white py-2 text-[11px] text-neutral-900 transition-colors has-[input:checked]:bg-neutral-100 has-[input:checked]:font-bold"
                  >
                    <input
                      type="radio"
                      name="heard-from"
                      value={opt}
                      required
                      checked={heardFromSource === opt}
                      onChange={() => setHeardFromSource(opt)}
                      className="sr-only"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
              {heardFromSource === "אחר" && (
                <input
                  value={heardFromOther}
                  onChange={(e) => setHeardFromOther(e.target.value)}
                  required
                  maxLength={80}
                  placeholder="פירוט"
                  className="h-10 border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-500"
                />
              )}
            </div>
            {error && (
              <p className="text-xs text-red-600" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className={`mt-2 flex h-12 w-full cursor-pointer items-center justify-center text-[11px] font-bold uppercase text-white disabled:cursor-not-allowed disabled:opacity-60 ${
                isWaitlist ? "bg-neutral-900" : "bg-brand"
              }`}
            >
              {submitting
                ? "שולח…"
                : isWaitlist
                  ? "הוסף לרשימת המתנה"
                  : "שליחת הזמנה"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
