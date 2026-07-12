import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-green-800 dark:text-green-500">
          FieldBook
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Sign in to your account
        </p>
      </div>

      <LoginForm next={next ?? "/today"} />
    </main>
  );
}
