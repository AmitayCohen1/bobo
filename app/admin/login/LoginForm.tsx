"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/admin/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    null
  );
  return (
    <form action={formAction} className="mt-5 flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-xs text-neutral-600">
        מייל
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          dir="ltr"
          className="h-10 border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-500 text-right"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-neutral-600">
        סיסמה
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          dir="ltr"
          className="h-10 border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-500 text-right"
        />
      </label>
      {state?.error && (
        <p className="text-xs text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 flex h-12 w-full cursor-pointer items-center justify-center bg-brand text-[11px] font-bold uppercase text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "מתחבר…" : "כניסה"}
      </button>
    </form>
  );
}
