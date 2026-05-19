"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
        <button
          onClick={reset}
          className="mt-4 px-4 py-2 bg-[#238636] hover:bg-[#2ea043] rounded-md text-sm font-medium transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
