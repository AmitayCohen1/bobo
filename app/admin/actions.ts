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
    return {
      error: "צריך להגדיר ADMIN_USERNAME ו־ADMIN_PASSWORD בקובץ .env.local",
    };
  }
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { error: "צריך להזין שם משתמש וסיסמה" };
  if (!checkAdminCredentials(username, password)) {
    return { error: "פרטי התחברות שגויים" };
  }
  await startAdminSession(username);
  redirect("/admin");
}

export async function logoutAction() {
  await endAdminSession();
  redirect("/admin/login");
}
