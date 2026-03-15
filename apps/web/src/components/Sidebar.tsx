import { auth, signOut } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";

export default async function Sidebar() {
    let session = null;
    try {
        session = await auth();
    } catch {
        // auth() can fail during static generation
    }

    return (
        <aside className="hidden w-[240px] shrink-0 border-r border-git-border pr-6 lg:block">
            <nav className="sticky top-6 flex flex-col gap-4 h-[calc(100vh-3rem)]">
                <Link href="/" className="font-mono text-xl font-bold tracking-tight text-git-text">
                    GitPulse<span className="text-git-green">.</span>
                </Link>

                <div className="mt-4 flex flex-col gap-1">
                    <Link href="/" className="rounded-md bg-git-card px-3 py-2 text-sm font-medium text-git-text border border-git-border">Home</Link>
                    <Link href="/" className="rounded-md px-3 py-2 text-sm text-git-muted hover:bg-git-card hover:text-git-text transition-colors">Discover</Link>
                    <Link href="/" className="rounded-md px-3 py-2 text-sm text-git-muted hover:bg-git-card hover:text-git-text transition-colors">Notifications</Link>
                    {session?.user?.login && (
                        <Link href={`/profile/${session.user.login}`} className="rounded-md px-3 py-2 text-sm text-git-muted hover:bg-git-card hover:text-git-text transition-colors">
                            Profile
                        </Link>
                    )}
                </div>

                {/* User Card */}
                {session?.user && (
                    <div className="mt-auto pt-6 border-t border-git-border">
                        <div className="flex items-center gap-3 mb-3">
                            {session.user.image && (
                                <Image
                                    src={session.user.image}
                                    alt={session.user.login || "User"}
                                    width={32}
                                    height={32}
                                    className="rounded-full border border-git-border"
                                />
                            )}
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-semibold text-git-text truncate">{session.user.name}</span>
                                <span className="text-xs font-mono text-git-muted truncate">@{session.user.login}</span>
                            </div>
                        </div>
                        <form action={async () => {
                            "use server";
                            await signOut({ redirectTo: "/login" });
                        }}>
                            <button type="submit" className="w-full rounded-md border border-git-border px-3 py-1.5 text-xs text-git-muted hover:text-[#f85149] hover:border-[#f85149] transition-colors">
                                Sign out
                            </button>
                        </form>
                    </div>
                )}
            </nav>
        </aside>
    );
}
