import { PromoPopup } from "./components/PromoPopup";
import { SeferCard } from "./components/SeferCard";
import { BoboCard } from "./components/BoboCard";
import { ChefCard } from "./components/ChefCard";
import { GallerySection } from "./components/GallerySection";

export default function Home() {
  return (
    <>
      <PromoPopup />

      <header className="px-6 pb-8 pt-14 text-center md:pb-12 md:pt-20">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-normal italic tracking-[-0.02em] text-neutral-900 md:text-3xl">
            קהילה יקרה
          </h1>
          <div className="mt-3">
            <p className="mx-auto max-w-xl text-xs font-light uppercase tracking-[-0.01em] text-neutral-500 md:text-sm">
              אי אפשר להסביר מה עברנו ביחד.
            </p>
            <p className="mx-auto max-w-xl text-xs font-light uppercase tracking-[-0.01em] text-neutral-500 md:text-sm">
              אז בואו לפחות נלבש את זה עלינו ונבלבל את כולם!
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-10 md:px-10">
        <ul className="mx-auto grid max-w-5xl grid-cols-1 items-start justify-center gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          <SeferCard />
          <BoboCard />
          <ChefCard />
        </ul>

        <div className="mt-[60px] flex flex-col items-center gap-3 text-center text-xs leading-relaxed text-neutral-500">
          <p>החולצות נמכרות במחיר חברי לכיסוי עלויות הייצור והחומרים</p>
          <p>מדובר בפרויקט אישי חד פעמי, לכן אין החלפות/החזרות, סליחה ♡</p>
          <a
            href="https://www.instagram.com/meitar.bar/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-neutral-700 transition-colors hover:text-neutral-900"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
            <span>צור קשר</span>
          </a>
        </div>
      </main>

      <GallerySection />
    </>
  );
}
