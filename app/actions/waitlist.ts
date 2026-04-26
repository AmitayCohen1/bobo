"use server";

import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { notifyNewWaitlistEntry } from "@/lib/notify";

export type JoinWaitlistInput = {
  product: string;
  size: string;
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

function trim(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

export async function joinWaitlist(
  input: JoinWaitlistInput
): Promise<JoinWaitlistResult> {
  const product = trim(input.product, MAX.product);
  const size = trim(input.size, MAX.size);
  const name = trim(input.name, MAX.name);
  const phone = trim(input.phone, MAX.phone);

  if (!product || !size) return { ok: false, error: "missing_product" };
  if (!name) return { ok: false, error: "missing_name" };
  if (!phone || phone.replace(/\D/g, "").length < 7) {
    return { ok: false, error: "invalid_phone" };
  }

  await sql`
    INSERT INTO waitlist (product, size, customer_name, phone)
    VALUES (${product}, ${size}, ${name}, ${phone})
  `;

  after(() => notifyNewWaitlistEntry({ product, size, name, phone }));

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
