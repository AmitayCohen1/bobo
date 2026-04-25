"use client";

import { useState } from "react";
import { ZoomImage } from "./ZoomImage";
import { SizeSelector, type Size } from "./SizeSelector";
import { OrderFormModal } from "./OrderFormModal";
import type { CreateOrderInput } from "@/app/actions/orders";

type SeferType = "חולצה" | "סווטשירט";

const imageFor = (type: SeferType) =>
  type === "חולצה"
    ? "/assets/kiryat_sefer_shirt.png"
    : "/assets/hotel_bobo_sweatshirt.png";

export function SeferCard() {
  const [type, setType] = useState<SeferType>("חולצה");
  const [size, setSize] = useState<Size>("M");
  const [draft, setDraft] = useState<Omit<
    CreateOrderInput,
    "name" | "phone" | "notes"
  > | null>(null);

  return (
    <li className="group flex flex-col items-center text-center">
      <ZoomImage src={imageFor(type)} />
      <div className="flex w-full max-w-[280px] flex-col items-center">
        <div className="my-3 flex gap-1.5">
          {(["חולצה", "סווטשירט"] as const).map((t) => (
            <label key={t} className="relative cursor-pointer">
              <input
                type="radio"
                name="type-1"
                value={t}
                checked={type === t}
                onChange={() => setType(t)}
                className="peer hidden"
              />
              <div className="flex min-w-[80px] items-center justify-center rounded-full border border-neutral-200 bg-white px-5 py-1.5 text-[11px] text-neutral-900 transition-all peer-checked:border-neutral-300 peer-checked:bg-neutral-100 peer-checked:font-bold">
                {t}
              </div>
            </label>
          ))}
        </div>
        <h2 className="mb-2 text-[0.85rem] font-medium uppercase tracking-[-0.01em] text-neutral-900">
          דגם &quot;מפוני קריית ספר&quot;
        </h2>
        <SizeSelector name="size-1" value={size} onChange={setSize} />
        <button
          type="button"
          onClick={() =>
            setDraft({
              product: "מפוני קריית ספר",
              variantType: type,
              color: null,
              size,
            })
          }
          className="flex h-12 w-full cursor-pointer items-center justify-center bg-brand text-[11px] font-bold uppercase text-white"
        >
          להזמנה
        </button>
      </div>
      <OrderFormModal
        open={draft !== null}
        order={draft}
        onClose={() => setDraft(null)}
      />
    </li>
  );
}
