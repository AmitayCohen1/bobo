import { neon } from "@neondatabase/serverless";

let cached: ReturnType<typeof neon> | null = null;

function client(): ReturnType<typeof neon> {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  cached = neon(url);
  return cached;
}

export const sql = ((strings: TemplateStringsArray, ...values: unknown[]) =>
  client()(strings, ...values)) as ReturnType<typeof neon>;

export type Order = {
  id: string;
  product: string;
  variant_type: string | null;
  color: string | null;
  size: string;
  quantity: number;
  customer_name: string;
  phone: string;
  notes: string | null;
  admin_note: string | null;
  heard_from: string | null;
  status: string;
  created_at: string;
};

export type WaitlistEntry = {
  id: string;
  product: string;
  size: string;
  quantity: number;
  customer_name: string;
  phone: string;
  admin_note: string | null;
  status: string;
  created_at: string;
};
