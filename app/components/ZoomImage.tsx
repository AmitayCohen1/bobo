"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  src: string;
  imgClassName?: string;
  containerClassName?: string;
};

export function ZoomImage({ src, imgClassName, containerClassName }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className={
          containerClassName ??
          "relative flex h-[280px] w-full max-w-[280px] cursor-pointer items-center justify-center overflow-hidden bg-white"
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className={
            imgClassName ??
            "h-full w-full object-contain transition-transform duration-700 group-hover:scale-110 sm:object-cover"
          }
        />
      </div>
      {mounted && open
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/95 p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) setOpen(false);
              }}
            >
              <button
                type="button"
                aria-label="סגור"
                onClick={() => setOpen(false)}
                className="absolute end-6 top-6 z-[70] cursor-pointer border-0 bg-transparent text-4xl font-light text-white transition-opacity hover:opacity-50"
              >
                ×
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                onClick={(e) => e.stopPropagation()}
                className="relative z-50 h-auto max-h-[90vh] w-auto max-w-[90vw] cursor-default object-contain"
              />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
