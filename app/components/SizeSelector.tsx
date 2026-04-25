"use client";

export type Size = "M" | "L" | "XL";

export function SizeSelector({
  name,
  value,
  onChange,
}: {
  name: string;
  value: Size;
  onChange: (v: Size) => void;
}) {
  return (
    <div className="mt-2 grid w-full grid-cols-3 gap-px border border-neutral-200 bg-neutral-200">
      {(["M", "L", "XL"] as const).map((s) => (
        <label
          key={s}
          className="flex cursor-pointer items-center justify-center bg-white py-2.5 text-[10px] text-neutral-900 transition-colors has-[input:checked]:bg-neutral-100 has-[input:checked]:font-bold"
        >
          <input
            type="radio"
            name={name}
            value={s}
            checked={value === s}
            onChange={() => onChange(s)}
            className="sr-only"
          />
          <span>{s}</span>
        </label>
      ))}
    </div>
  );
}
