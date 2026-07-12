"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Email
        </span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          className="h-12 rounded-lg border border-neutral-300 bg-white px-3 text-base text-neutral-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Password
        </span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-12 rounded-lg border border-neutral-300 bg-white px-3 text-base text-neutral-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </label>

      {state.error && (
        <p className="text-sm font-medium text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 h-12 rounded-lg bg-green-700 text-base font-semibold text-white transition-colors hover:bg-green-800 active:bg-green-900 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
