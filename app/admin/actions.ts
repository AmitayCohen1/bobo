"use server";

import { redirect } from "next/navigation";
import {
  checkAdminCredentials,
  endAdminSession,
  isAdminConfigured,
  startAdminSession,
} from "@/lib/auth";

export type LoginState = { error?: string } | null;

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  if (!isAdminConfigured()) {
    return { error: "צריך להגדיר ADMIN_EMAIL ו־ADMIN_PASSWORD בקובץ .env.local" };
  }
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "צריך להזין מייל וסיסמה" };
  if (!checkAdminCredentials(email, password)) {
    return { error: "פרטי התחברות שגויים" };
  }
  await startAdminSession(email);
  redirect("/admin");
}

export async function logoutAction() {
  await endAdminSession();
  redirect("/admin/login");
}
