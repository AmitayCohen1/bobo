"use client";

import { ZoomImage } from "./ZoomImage";

export function ChefCard() {
  return (
    <li className="group flex flex-col items-center text-center">
      <ZoomImage src="/assets/bless_the_chef_shirt.png" />
      <div className="flex w-full max-w-[280px] flex-col items-center">
        <div className="h-[52px]" />
        <h2 className="mb-2 text-[0.85rem] font-medium uppercase tracking-[-0.01em] text-neutral-900">
          חולצת רקמה &quot;בעזרת השף&quot;
        </h2>
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="flex h-12 w-full cursor-not-allowed items-center justify-center bg-neutral-300 text-[11px] font-bold uppercase text-neutral-500"
        >
          אזל המלאי
        </button>
        <p className="mt-2 text-[10px] uppercase tracking-wide text-neutral-500">
          לא ניתן להזמין כרגע
        </p>
      </div>
    </li>
  );
}
