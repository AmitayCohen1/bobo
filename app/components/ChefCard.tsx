"use client";

import { useState } from "react";
import { ZoomImage } from "./ZoomImage";
import { SizeSelector, type Size } from "./SizeSelector";
import { OrderFormModal } from "./OrderFormModal";
import type { CreateOrderInput } from "@/app/actions/orders";

const PRODUCT = "חולצת רקמה בעזרת השף";

export function ChefCard() {
  const [size, setSize] = useState<Size>("M");
  const [draft, setDraft] = useState<Omit<
    CreateOrderInput,
    "name" | "phone" | "notes" | "isWaitlist"
  > | null>(null);

  return (
    <li className="group flex flex-col items-center text-center">
      <ZoomImage src="/assets/bless_the_chef_shirt.png" />
      <div className="flex w-full max-w-[280px] flex-col items-center">
        <div className="h-[52px]" />
        <h2 className="mb-2 text-[0.85rem] font-medium uppercase tracking-[-0.01em] text-neutral-900">
          חולצת רקמה &quot;בעזרת השף&quot;
        </h2>
        <SizeSelector name="size-3" value={size} onChange={setSize} />
        <button
          type="button"
          onClick={() => setDraft({ product: PRODUCT, size })}
          className="flex h-12 w-full cursor-pointer items-center justify-center bg-neutral-900 text-[11px] font-bold uppercase text-white"
        >
          הוסף לרשימת המתנה
        </button>
        <p className="mt-2 text-[10px] uppercase tracking-wide text-neutral-500">
          אזל המלאי — ניצור קשר כשיגיע
        </p>
      </div>
      <OrderFormModal
        open={draft !== null}
        order={draft}
        mode="waitlist"
        onClose={() => setDraft(null)}
      />
    </li>
  );
}
