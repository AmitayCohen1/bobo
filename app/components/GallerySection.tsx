"use client";

import { useEffect, useState } from "react";

const galleryImages = Array.from(
  { length: 17 },
  (_, i) => `/assets/gallery ${i + 1}.png`
);

export function GallerySection() {
  const [current, setCurrent] = useState(0);
  const [modalIndex, setModalIndex] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(
      () => setCurrent((s) => (s + 1) % galleryImages.length),
      2000
    );
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (modalIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") shift(-1);
      if (e.key === "ArrowLeft") shift(1);
      if (e.key === "Escape") setModalIndex(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalIndex]);

  function shift(step: number) {
    setModalIndex((i) =>
      i === null
        ? i
        : (i + step + galleryImages.length) % galleryImages.length
    );
  }

  return (
    <section className="mb-20 mt-10">
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] h-[115vw] w-screen overflow-hidden sm:h-[70vh]">
        <button
          type="button"
          aria-label="הקודם"
          onClick={() =>
            setCurrent((s) => (s - 1 + galleryImages.length) % galleryImages.length)
          }
          className="absolute right-5 top-1/2 z-20 flex h-[50px] w-[50px] -translate-y-1/2 cursor-pointer items-center justify-center border-0 bg-white/70 text-2xl"
        >
          ❮
        </button>
        <button
          type="button"
          aria-label="הבא"
          onClick={() => setCurrent((s) => (s + 1) % galleryImages.length)}
          className="absolute left-5 top-1/2 z-20 flex h-[50px] w-[50px] -translate-y-1/2 cursor-pointer items-center justify-center border-0 bg-white/70 text-2xl"
        >
          ❯
        </button>
        {galleryImages.map((src, i) => (
          <div
            key={src}
            className={`absolute inset-0 cursor-pointer ${
              i === current ? "z-10 block" : "hidden"
            }`}
            onClick={() => setModalIndex(i)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>

      {modalIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/95 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalIndex(null);
          }}
        >
          <button
            type="button"
            aria-label="סגור"
            onClick={() => setModalIndex(null)}
            className="absolute end-6 top-6 z-[70] cursor-pointer border-0 bg-transparent text-4xl font-light text-white transition-opacity hover:opacity-50"
          >
            ×
          </button>
          <button
            type="button"
            aria-label="הקודם"
            onClick={(e) => {
              e.stopPropagation();
              shift(-1);
            }}
            className="absolute right-10 top-1/2 z-[60] -translate-y-1/2 cursor-pointer select-none border-0 bg-transparent text-5xl text-white"
          >
            ❮
          </button>
          <button
            type="button"
            aria-label="הבא"
            onClick={(e) => {
              e.stopPropagation();
              shift(1);
            }}
            className="absolute left-10 top-1/2 z-[60] -translate-y-1/2 cursor-pointer select-none border-0 bg-transparent text-5xl text-white"
          >
            ❯
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={galleryImages[modalIndex]}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="relative z-50 h-auto max-h-[90vh] w-auto max-w-[90vw] cursor-default object-contain"
          />
        </div>
      )}
    </section>
  );
}
