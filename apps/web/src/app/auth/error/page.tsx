import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

const errorMessages: Record<string, string> = {
  Configuration: "GitHub sign-in is not configured correctly on the server. Please try email sign-in while we fix the GitHub settings.",
  AccessDenied: "Access was denied. Please try signing in again.",
  Verification: "This sign-in link is invalid or expired. Please try again.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth().catch(() => null);
  if (session?.user) {
    redirect("/");
  }

  const params = await searchParams;
  const error = typeof params?.error === "string" ? params.error : "Unknown";
  const message = errorMessages[error] ?? "Something went wrong during sign-in. Please try again.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-git-bg px-4 text-git-text">
      <div className="w-full max-w-md rounded-2xl border border-git-border bg-git-card p-8 text-center shadow-xl">
        <h1 className="text-2xl font-bold">Sign-in problem</h1>
        <p className="mt-4 text-sm leading-6 text-git-muted">{message}</p>
        <p className="mt-3 text-xs text-git-muted">Error: {error}</p>
        <div className="mt-6 flex flex-col gap-3">
          <Link href="/login" className="rounded-full bg-git-green px-4 py-2 text-sm font-semibold text-white hover:bg-git-green-hover transition-colors">
            Back to login
          </Link>
          <Link href="/" className="rounded-full border border-git-border px-4 py-2 text-sm font-semibold text-git-text hover:bg-git-hover transition-colors">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
