"use client";

import { useState } from "react";
import { ZoomImage } from "./ZoomImage";
import { SizeSelector, type Size } from "./SizeSelector";
import { OrderFormModal } from "./OrderFormModal";
import type { CreateOrderInput } from "@/app/actions/orders";

type BoboColor = "ירוק" | "חום";

const imageFor = (color: BoboColor) =>
  color === "ירוק"
    ? "/assets/hotel_bobo_shirt_green.png"
    : "/assets/hotel_bobo_shirt_brown.png";

export function BoboCard() {
  const [color, setColor] = useState<BoboColor>("ירוק");
  const [size, setSize] = useState<Size>("M");
  const [draft, setDraft] = useState<Omit<
    CreateOrderInput,
    "name" | "phone" | "notes"
  > | null>(null);

  return (
    <li className="group flex flex-col items-center text-center">
      <ZoomImage src={imageFor(color)} />
      <div className="flex w-full max-w-[280px] flex-col items-center">
        <div className="my-3 flex h-7 items-center gap-3">
          <ColorSwatch
            className="bg-[#5d4037]"
            selected={color === "חום"}
            onClick={() => setColor("חום")}
          />
          <ColorSwatch
            className="bg-[#2d4c3b]"
            selected={color === "ירוק"}
            onClick={() => setColor("ירוק")}
          />
        </div>
        <h2 className="mb-1 text-[0.85rem] font-medium uppercase tracking-[-0.01em] text-neutral-900">
          חולצת &quot;מפוני הבובו&quot;
        </h2>
        <p className="mb-2 text-[11px] text-neutral-500">₪80</p>
        <SizeSelector name="size-2" value={size} onChange={setSize} />
        <button
          type="button"
          onClick={() =>
            setDraft({
              product: "חולצת מפוני הבובו",
              variantType: null,
              color,
              size,
            })
          }
          className="flex h-12 w-full cursor-pointer items-center justify-center bg-neutral-900 text-[11px] font-bold uppercase text-white"
        >
          הצטרפות לרשימת המתנה
        </button>
      </div>
      <OrderFormModal
        open={draft !== null}
        order={draft}
        onClose={() => setDraft(null)}
        mode="waitlist"
      />
    </li>
  );
}

function ColorSwatch({
  className,
  selected,
  onClick,
}: {
  className: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`h-[22px] w-[22px] cursor-pointer rounded-full border transition-transform ${className} ${
        selected ? "scale-[1.15] border-neutral-900" : "border-neutral-300"
      }`}
    />
  );
}
