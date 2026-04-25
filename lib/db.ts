import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set");
}

export const sql = neon(url);

export type Order = {
  id: string;
  product: string;
  variant_type: string | null;
  color: string | null;
  size: string;
  customer_name: string;
  phone: string;
  notes: string | null;
  status: string;
  created_at: string;
};
