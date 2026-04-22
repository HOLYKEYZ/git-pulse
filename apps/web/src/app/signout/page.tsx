import { signOut } from "@/lib/auth";
import Link from "next/link";

const handleSignOutAction = async () => {
  "use server";
  await signOut({ redirectTo: "/" });
};

export default function SignOutPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-git-bg px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm rounded-xl border border-git-border bg-git-card p-8 shadow-xl">
        <div className="text-center">
          <svg
            height="36"
            viewBox="0 0 16 16"
            width="36"
            className="fill-git-text mx-auto mb-4"
          >
            <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
          </svg>
          <h2 className="text-xl font-semibold tracking-tight text-git-text mb-1">
            Sign out
          </h2>
          <p className="text-sm text-git-muted">
            Are you sure you want to sign out of GitPulse?
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <form action={handleSignOutAction}
          >
            <button
              type="submit"
              className="flex w-full justify-center rounded-lg bg-red-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors"
            >
              Sign out
            </button>
          </form>

          <Link
            href="/"
            className="flex w-full justify-center rounded-lg border border-git-border px-3 py-2.5 text-sm font-medium text-git-muted hover:text-git-text hover:border-git-text/20 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
