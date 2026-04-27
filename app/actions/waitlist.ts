"use server";

import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { notifyNewWaitlistEntry } from "@/lib/notify";

export type JoinWaitlistInput = {
  product: string;
  size: string;
  quantity?: number;
  name: string;
  phone: string;
};

export type JoinWaitlistResult =
  | { ok: true }
  | { ok: false; error: string };

const MAX = {
  product: 200,
  size: 16,
  name: 120,
  phone: 40,
};

const QUANTITY_MIN = 1;
const QUANTITY_MAX = 10;

function trim(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

function clampQuantity(value: unknown): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return QUANTITY_MIN;
  return Math.min(QUANTITY_MAX, Math.max(QUANTITY_MIN, n));
}

export async function joinWaitlist(
  input: JoinWaitlistInput
): Promise<JoinWaitlistResult> {
  const product = trim(input.product, MAX.product);
  const size = trim(input.size, MAX.size);
  const name = trim(input.name, MAX.name);
  const phone = trim(input.phone, MAX.phone);
  const quantity = clampQuantity(input.quantity);

  if (!product || !size) return { ok: false, error: "missing_product" };
  if (!name) return { ok: false, error: "missing_name" };
  if (!phone || phone.replace(/\D/g, "").length < 7) {
    return { ok: false, error: "invalid_phone" };
  }

  await sql`
    INSERT INTO waitlist (product, size, quantity, customer_name, phone)
    VALUES (${product}, ${size}, ${quantity}, ${name}, ${phone})
  `;

  after(() => notifyNewWaitlistEntry({ product, size, quantity, name, phone }));

  revalidatePath("/admin");
  return { ok: true };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function deleteWaitlistEntry(formData: FormData): Promise<void> {
  const session = await getAdminSession();
  if (!session) throw new Error("unauthorized");

  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) throw new Error("invalid_id");

  await sql`DELETE FROM waitlist WHERE id = ${id}`;
  revalidatePath("/admin");
}

const VALID_SIZES = new Set(["S", "M", "L", "XL"]);

export async function updateWaitlistSize(formData: FormData): Promise<void> {
  const session = await getAdminSession();
  if (!session) throw new Error("unauthorized");

  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) throw new Error("invalid_id");

  const size = String(formData.get("size") ?? "").trim();
  if (!VALID_SIZES.has(size)) throw new Error("invalid_size");

  await sql`UPDATE waitlist SET size = ${size} WHERE id = ${id}`;
  revalidatePath("/admin");
}

export async function updateWaitlistQuantity(formData: FormData): Promise<void> {
  const session = await getAdminSession();
  if (!session) throw new Error("unauthorized");

  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) throw new Error("invalid_id");

  const quantity = clampQuantity(formData.get("quantity"));

  await sql`UPDATE waitlist SET quantity = ${quantity} WHERE id = ${id}`;
  revalidatePath("/admin");
}

const ADMIN_NOTE_MAX = 2000;

export async function updateWaitlistAdminNote(formData: FormData): Promise<void> {
  const session = await getAdminSession();
  if (!session) throw new Error("unauthorized");

  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) throw new Error("invalid_id");

  const raw = String(formData.get("admin_note") ?? "").trim().slice(0, ADMIN_NOTE_MAX);
  const value = raw.length > 0 ? raw : null;

  await sql`UPDATE waitlist SET admin_note = ${value} WHERE id = ${id}`;
  revalidatePath("/admin");
}
