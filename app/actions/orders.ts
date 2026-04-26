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
  name: string;
  phone: string;
  notes?: string | null;
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
};

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

  if (!product || !size) return { ok: false, error: "missing_product" };
  if (!name) return { ok: false, error: "missing_name" };
  if (!phone || phone.replace(/\D/g, "").length < 7) {
    return { ok: false, error: "invalid_phone" };
  }

  await sql`
    INSERT INTO orders (product, variant_type, color, size, customer_name, phone, notes)
    VALUES (${product}, ${variantType}, ${color}, ${size}, ${name}, ${phone}, ${notes})
  `;

  after(() => notifyNewOrder({ product, variantType, color, size, name, phone, notes }));

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
