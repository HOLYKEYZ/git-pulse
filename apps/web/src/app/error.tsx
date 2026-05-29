"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D1117] text-white px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-gray-400">
          {error?.message ?? "An unexpected error occurred."}
        </p>
        {error?.digest && (
          <p className="text-xs text-gray-500 font-mono">Digest: {error.digest}</p>
        )}
        <div className="flex justify-center gap-3 mt-4">
          <button
            onClick={reset}
            className="px-4 py-2 bg-[#238636] hover:bg-[#2ea043] rounded-md text-sm font-medium transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-[#30363d] hover:bg-[#484f58] rounded-md text-sm font-medium transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
