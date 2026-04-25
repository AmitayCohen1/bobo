import { ZoomImage } from "./ZoomImage";

export function ChefCard() {
  return (
    <li className="group flex flex-col items-center text-center opacity-75">
      <ZoomImage src="/assets/bless_the_chef_shirt.png" />
      <div className="flex w-full max-w-[280px] flex-col items-center">
        <div className="h-[52px]" />
        <h2 className="mb-2 text-[0.85rem] font-medium uppercase tracking-[-0.01em] text-neutral-900">
          חולצת רקמה &quot;בעזרת השף&quot;
        </h2>
        <div className="mt-2 grid w-full grid-cols-3 gap-px border border-neutral-200 bg-neutral-200 opacity-50">
          {(["M", "L", "XL"] as const).map((s) => (
            <div
              key={s}
              className="flex items-center justify-center bg-white py-2.5 text-[10px] text-neutral-900"
            >
              {s}
            </div>
          ))}
        </div>
        <div className="flex h-12 w-full cursor-default items-center justify-center border border-neutral-200 bg-neutral-100 text-[11px] uppercase text-neutral-500">
          אזל המלאי
        </div>
      </div>
    </li>
  );
}
