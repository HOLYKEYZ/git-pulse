import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <h2 className="text-2xl font-bold text-git-text">404</h2>
            <p className="text-git-muted">This page could not be found.</p>
            <Link
                href="/"
                className="rounded-md bg-git-green px-4 py-2 text-sm font-semibold text-white hover:bg-[#2ea043] transition-colors"
            >
                Return Home
            </Link>
        </div>
    );
}
