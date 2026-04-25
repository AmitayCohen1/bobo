"use client";

import { useActionState } from "react";
import { LogIn, Lock, User } from "lucide-react";
import { loginAction, type LoginState } from "@/app/admin/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    null
  );
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-xs text-neutral-600">
        שם משתמש
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            name="username"
            type="text"
            autoComplete="username"
            required
            dir="ltr"
            className="h-10 w-full rounded border border-neutral-200 bg-white pl-9 pr-3 text-right text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-500"
          />
        </div>
      </label>
      <label className="flex flex-col gap-1.5 text-xs text-neutral-600">
        סיסמה
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            dir="ltr"
            className="h-10 w-full rounded border border-neutral-200 bg-white pl-9 pr-3 text-right text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-500"
          />
        </div>
      </label>
      {state?.error && (
        <p
          role="alert"
          className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
        >
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded bg-brand text-[12px] font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LogIn className="h-4 w-4" />
        {pending ? "מתחבר…" : "כניסה"}
      </button>
    </form>
  );
}
