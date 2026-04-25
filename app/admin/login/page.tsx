import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getAdminSession } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "כניסת מנהל" };

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100 px-4 py-10">
      <div className="w-full max-w-sm rounded-md border border-neutral-200 bg-white p-7 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white">
            <ShieldCheck className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <h1 className="text-base font-medium tracking-[-0.01em] text-neutral-900">
              כניסת מנהל
            </h1>
            <p className="text-xs text-neutral-500">בובו · ניהול הזמנות</p>
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
