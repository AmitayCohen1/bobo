import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "כניסת מנהל" };

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm bg-white p-8 shadow-sm border border-neutral-200">
        <h1 className="text-lg font-medium uppercase tracking-[-0.01em] text-neutral-900">
          כניסת מנהל
        </h1>
        <p className="mt-1 text-xs text-neutral-500">
          הזינו את המייל והסיסמה שהוגדרו ב־.env.local
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
