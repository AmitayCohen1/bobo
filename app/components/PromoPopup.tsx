"use client";

import { useEffect, useRef, useState } from "react";

export function PromoPopup() {
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      setOpen(true);
      const v = videoRef.current;
      if (v) {
        v.currentTime = 0;
        v.play().catch(() => {});
      }
    }, 800);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
    videoRef.current?.pause();
  }

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="relative w-[90%] max-w-[550px] bg-black shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
        <button
          type="button"
          onClick={close}
          aria-label="סגור"
          className="absolute top-[15px] right-[15px] z-[101] cursor-pointer border-0 bg-transparent text-[28px] font-extralight leading-none text-white opacity-60 transition-opacity hover:opacity-100"
        >
          ×
        </button>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          poster="/assets/sticker_pic.png"
          className="block h-auto w-full focus:outline-none"
        >
          <source src="/assets/sticker_pic.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  );
}
