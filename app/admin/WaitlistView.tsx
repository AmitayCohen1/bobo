"use client";

import { useMemo, useState } from "react";
import {
  Clock,
  Hash,
  Inbox,
  Megaphone,
  NotebookPen,
  Package,
  Phone,
  PhoneCall,
  Ruler,
  Search,
  StickyNote,
  User,
} from "lucide-react";
import type { WaitlistEntry } from "@/lib/db";
import {
  deleteWaitlistEntry,
  updateWaitlistAdminNote,
} from "@/app/actions/waitlist";
import { imagePathFor } from "@/lib/product-image";
import { DeleteOrderButton } from "./DeleteOrderButton";
import { AdminNoteEditor } from "./AdminNoteEditor";
import { ContactedToggle } from "./ContactedToggle";

const dateFmt = new Intl.DateTimeFormat("he-IL", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jerusalem",
});

const dayFmt = new Intl.DateTimeFormat("he-IL", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Jerusalem",
});

const timeFmt = new Intl.DateTimeFormat("he-IL", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jerusalem",
});

function productLabel(o: WaitlistEntry): string {
  return [o.variant_type, o.product, o.color && `(${o.color})`]
    .filter(Boolean)
    .join(" ");
}

function imageFor(o: {
  product: string;
  variant_type: string | null;
  color: string | null;
}) {
  return imagePathFor({
    product: o.product,
    variantType: o.variant_type,
    color: o.color,
  });
}

function whatsappLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("0") ? "972" + digits.slice(1) : digits;
  return `https://wa.me/${intl}`;
}

function confirmDelete(name: string): string {
  return `למחוק את הרישום של ${name} מרשימת ההמתנה?`;
}

export function WaitlistView({ entries }: { entries: WaitlistEntry[] }) {
  const [query, setQuery] = useState("");
  const [hideContacted, setHideContacted] = useState(false);

  const filtered = useMemo(() => {
    let result = entries;
    if (hideContacted) {
      result = result.filter((e) => !e.contacted);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((e) => {
        const haystack = [
          e.customer_name,
          e.phone,
          e.product,
          e.variant_type,
          e.color,
          e.size,
          e.notes,
          e.admin_note,
          e.heard_from,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }
    return result;
  }, [entries, query, hideContacted]);

  const totalUnits = useMemo(
    () => entries.reduce((acc, e) => acc + (e.quantity ?? 1), 0),
    [entries]
  );
  const filteredUnits = useMemo(
    () => filtered.reduce((acc, e) => acc + (e.quantity ?? 1), 0),
    [filtered]
  );
  const pendingCount = useMemo(
    () => entries.filter((e) => !e.contacted).length,
    [entries]
  );

  if (entries.length === 0) {
    return (
      <section className="mt-4 rounded-3xl border border-neutral-200 bg-white/90 p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] backdrop-blur md:p-4">
        <header className="flex items-center gap-3 border-b border-neutral-100 pb-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <PhoneCall className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="text-base font-semibold tracking-[-0.02em] text-neutral-950">
              רשימת המתנה
            </h2>
            <p className="text-xs text-neutral-500">
              לקוחות שמחכים שיהיה מלאי
            </p>
          </div>
        </header>
        <div className="mt-4 flex flex-col items-center justify-center px-6 py-12 text-center">
          <Inbox className="h-7 w-7 text-neutral-400" strokeWidth={1.5} />
          <p className="mt-3 text-sm font-medium text-neutral-600">
            אין רישומים ברשימת ההמתנה
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-4 rounded-3xl border border-neutral-200 bg-white/90 p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] backdrop-blur md:p-4">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <PhoneCall className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="text-base font-semibold tracking-[-0.02em] text-neutral-950">
              רשימת המתנה
            </h2>
            <p className="text-xs text-neutral-500">
              {entries.length} רישומים · {totalUnits} יחידות · {pendingCount}{" "}
              ממתינים לחזרה
            </p>
          </div>
        </div>
      </header>

      <div className="mt-4 flex flex-col gap-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            strokeWidth={1.75}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש לפי שם, טלפון, מוצר או הערה"
            className="h-10 w-full rounded-2xl border border-neutral-200 bg-white pr-10 pl-4 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-neutral-700">
            <input
              type="checkbox"
              checked={hideContacted}
              onChange={(e) => setHideContacted(e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-neutral-900"
            />
            הסתר רישומים שכבר יצרנו איתם קשר
          </label>
          <span className="text-xs text-neutral-600">
            {filtered.length === entries.length
              ? `${entries.length} רישומים · ${totalUnits} יחידות`
              : `${filtered.length} מתוך ${entries.length} רישומים · ${filteredUnits} מתוך ${totalUnits} יחידות`}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
            <p className="text-sm font-medium text-neutral-600">
              אין תוצאות לחיפוש
            </p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <ul className="flex flex-col gap-3 md:hidden">
              {filtered.map((e) => (
                <EntryCard key={e.id} entry={e} />
              ))}
            </ul>

            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)] md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-neutral-50/80 text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                    <tr>
                      <Th icon={Clock}>תאריך</Th>
                      <Th icon={Package}>מוצר</Th>
                      <Th icon={Ruler}>מידה</Th>
                      <Th icon={Hash}>כמות</Th>
                      <Th icon={User}>לקוח</Th>
                      <Th icon={Phone}>טלפון</Th>
                      <Th icon={Megaphone}>מקור</Th>
                      <Th icon={PhoneCall}>נוצר קשר</Th>
                      <Th icon={StickyNote}>הערות</Th>
                      <Th icon={NotebookPen}>הערה לעצמי</Th>
                      <th className="px-4 py-3 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((e) => (
                      <EntryRow key={e.id} entry={e} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function Th({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  children: React.ReactNode;
}) {
  return (
    <th className="px-4 py-3 font-medium">
      <span className="inline-flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.75} />
        <span>{children}</span>
      </span>
    </th>
  );
}

function WaButton({ phone }: { phone: string }) {
  return (
    <a
      href={whatsappLink(phone)}
      target="_blank"
      rel="noreferrer"
      title="שליחת הודעה בוואטסאפ"
      aria-label="WhatsApp"
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white transition-transform hover:scale-110"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
      </svg>
    </a>
  );
}

function PhoneCell({ phone }: { phone: string }) {
  return (
    <div className="inline-flex items-center gap-2" dir="ltr">
      <a
        href={`tel:${phone}`}
        className="inline-flex items-center gap-1.5 text-neutral-700 hover:text-neutral-900"
      >
        <Phone className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.75} />
        <span>{phone}</span>
      </a>
      <WaButton phone={phone} />
    </div>
  );
}

function EntryRow({ entry: e }: { entry: WaitlistEntry }) {
  return (
    <tr className="border-t border-neutral-100 align-top transition-colors hover:bg-neutral-50/70">
      <td className="whitespace-nowrap px-2 py-3 text-[11px] leading-tight text-neutral-500">
        <div className="flex flex-col tabular-nums">
          <span>{dayFmt.format(new Date(e.created_at))}</span>
          <span className="text-neutral-400">
            {timeFmt.format(new Date(e.created_at))}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-neutral-900">
        <div className="flex items-start gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageFor(e)}
            alt=""
            className="h-10 w-10 shrink-0 object-contain"
          />
          <span className="font-medium">{productLabel(e)}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-neutral-900">{e.size}</td>
      <td className="px-4 py-3 text-neutral-900">{e.quantity}</td>
      <td className="px-4 py-3 text-neutral-900">{e.customer_name}</td>
      <td className="px-4 py-3 text-neutral-900">
        <PhoneCell phone={e.phone} />
      </td>
      <td className="px-4 py-3 text-neutral-700">
        {e.heard_from ?? <span className="text-neutral-300">—</span>}
      </td>
      <td className="px-4 py-3 text-neutral-900">
        <ContactedToggle id={e.id} initial={e.contacted} />
      </td>
      <td className="max-w-xs whitespace-pre-wrap px-4 py-3 text-neutral-700">
        {e.notes ? (
          <span className="inline-flex items-start gap-1.5">
            <StickyNote
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400"
              strokeWidth={1.75}
            />
            <span>{e.notes}</span>
          </span>
        ) : (
          <span className="text-neutral-300">—</span>
        )}
      </td>
      <td className="max-w-xs px-4 py-3 align-top">
        <AdminNoteEditor
          id={e.id}
          initialNote={e.admin_note}
          action={updateWaitlistAdminNote}
        />
      </td>
      <td className="px-2 py-3 text-left">
        <DeleteOrderButton
          id={e.id}
          label={e.customer_name}
          action={deleteWaitlistEntry}
          confirmText={confirmDelete}
        />
      </td>
    </tr>
  );
}

function EntryCard({ entry: e }: { entry: WaitlistEntry }) {
  return (
    <li className="rounded border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageFor(e)}
            alt=""
            className="h-12 w-12 shrink-0 object-contain"
          />
          <div className="min-w-0 flex-1">
            <span className="text-[11px] text-neutral-500">
              {dateFmt.format(new Date(e.created_at))}
            </span>
            <p className="mt-1 text-sm font-medium text-neutral-900">
              {productLabel(e)}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              מידה {e.size} · כמות {e.quantity}
            </p>
          </div>
        </div>
        <DeleteOrderButton
          id={e.id}
          label={e.customer_name}
          variant="full"
          action={deleteWaitlistEntry}
          confirmText={confirmDelete}
        />
      </div>
      <div className="mt-3 flex flex-col gap-1.5 border-t border-neutral-100 pt-3 text-sm">
        <p className="flex items-center gap-2 text-neutral-700">
          <User className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.75} />
          {e.customer_name}
        </p>
        <PhoneCell phone={e.phone} />
        {e.heard_from && (
          <p className="flex items-center gap-2 text-xs text-neutral-500">
            <Megaphone className="h-3.5 w-3.5" strokeWidth={1.75} />
            {e.heard_from}
          </p>
        )}
        <span className="inline-flex items-center gap-2 text-xs text-neutral-700">
          <span className="text-neutral-400">נוצר קשר</span>
          <ContactedToggle id={e.id} initial={e.contacted} />
        </span>
        {e.notes && (
          <p className="flex items-start gap-2 whitespace-pre-wrap text-neutral-700">
            <StickyNote
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400"
              strokeWidth={1.75}
            />
            <span>{e.notes}</span>
          </p>
        )}
        <div className="mt-1">
          <AdminNoteEditor
            id={e.id}
            initialNote={e.admin_note}
            action={updateWaitlistAdminNote}
          />
        </div>
      </div>
    </li>
  );
}
