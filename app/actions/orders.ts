"use server";

import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { notifyNewOrder } from "@/lib/notify";

export type CreateOrderInput = {
  product: string;
  variantType?: string | null;
  color?: string | null;
  size: string;
  quantity?: number;
  name: string;
  phone: string;
  notes?: string | null;
  heardFrom?: string | null;
};

export type CreateOrderResult =
  | { ok: true }
  | { ok: false; error: string };

const MAX = {
  product: 200,
  variantType: 80,
  color: 80,
  size: 16,
  name: 120,
  phone: 40,
  notes: 1000,
  heardFrom: 80,
};

const QUANTITY_MIN = 1;
const QUANTITY_MAX = 10;

function clampQuantity(value: unknown): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return QUANTITY_MIN;
  return Math.min(QUANTITY_MAX, Math.max(QUANTITY_MIN, n));
}

function trim(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

export async function createOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  const product = trim(input.product, MAX.product);
  const variantType = input.variantType
    ? trim(input.variantType, MAX.variantType)
    : null;
  const color = input.color ? trim(input.color, MAX.color) : null;
  const size = trim(input.size, MAX.size);
  const name = trim(input.name, MAX.name);
  const phone = trim(input.phone, MAX.phone);
  const notes = input.notes ? trim(input.notes, MAX.notes) : null;
  const heardFrom = input.heardFrom ? trim(input.heardFrom, MAX.heardFrom) : null;
  const quantity = clampQuantity(input.quantity);

  if (!product || !size) return { ok: false, error: "missing_product" };
  if (!name) return { ok: false, error: "missing_name" };
  if (!phone || phone.replace(/\D/g, "").length < 7) {
    return { ok: false, error: "invalid_phone" };
  }
  if (!heardFrom) return { ok: false, error: "missing_heard_from" };

  await sql`
    INSERT INTO orders (product, variant_type, color, size, quantity, customer_name, phone, notes, heard_from)
    VALUES (${product}, ${variantType}, ${color}, ${size}, ${quantity}, ${name}, ${phone}, ${notes}, ${heardFrom})
  `;

  after(() => notifyNewOrder({ product, variantType, color, size, quantity, name, phone, notes, heardFrom }));

  revalidatePath("/admin");
  return { ok: true };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function deleteOrder(formData: FormData): Promise<void> {
  const session = await getAdminSession();
  if (!session) throw new Error("unauthorized");

  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) throw new Error("invalid_id");

  await sql`DELETE FROM orders WHERE id = ${id}`;
  revalidatePath("/admin");
}

const VALID_SIZES = new Set(["S", "M", "L", "XL"]);

export async function updateOrderSize(formData: FormData): Promise<void> {
  const session = await getAdminSession();
  if (!session) throw new Error("unauthorized");

  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) throw new Error("invalid_id");

  const size = String(formData.get("size") ?? "").trim();
  if (!VALID_SIZES.has(size)) throw new Error("invalid_size");

  await sql`UPDATE orders SET size = ${size} WHERE id = ${id}`;
  revalidatePath("/admin");
}

export async function updateOrderQuantity(formData: FormData): Promise<void> {
  const session = await getAdminSession();
  if (!session) throw new Error("unauthorized");

  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) throw new Error("invalid_id");

  const quantity = clampQuantity(formData.get("quantity"));

  await sql`UPDATE orders SET quantity = ${quantity} WHERE id = ${id}`;
  revalidatePath("/admin");
}

export async function updateOrderHeardFrom(formData: FormData): Promise<void> {
  const session = await getAdminSession();
  if (!session) throw new Error("unauthorized");

  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) throw new Error("invalid_id");

  const raw = String(formData.get("heard_from") ?? "").trim().slice(0, MAX.heardFrom);
  const value = raw.length > 0 ? raw : null;

  await sql`UPDATE orders SET heard_from = ${value} WHERE id = ${id}`;
  revalidatePath("/admin");
}

const ADMIN_NOTE_MAX = 2000;

export async function updateOrderAdminNote(formData: FormData): Promise<void> {
  const session = await getAdminSession();
  if (!session) throw new Error("unauthorized");

  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) throw new Error("invalid_id");

  const raw = String(formData.get("admin_note") ?? "").trim().slice(0, ADMIN_NOTE_MAX);
  const value = raw.length > 0 ? raw : null;

  await sql`UPDATE orders SET admin_note = ${value} WHERE id = ${id}`;
  revalidatePath("/admin");
}
