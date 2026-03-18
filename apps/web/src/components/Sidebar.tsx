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
                <Link href="/" className="flex items-center gap-2.5 group">
                    {/* GitHub Invertocat Logo */}
                    <svg height="28" viewBox="0 0 16 16" width="28" className="fill-git-text group-hover:fill-git-blue transition-colors">
                        <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/>
                    </svg>
                    <span className="font-semibold text-lg text-git-text tracking-tight">
                        GitPulse
                    </span>
                </Link>

                <div className="mt-4 flex flex-col gap-1">
                    <Link href="/" className="rounded-md bg-git-card px-3 py-2 text-sm font-medium text-git-text border border-git-border hover:bg-[#161b22] transition-colors">
                        <span className="flex items-center gap-2">
                            <svg height="16" viewBox="0 0 16 16" width="16" className="fill-current"><path d="M6.906.664a1.749 1.749 0 0 1 2.187 0l5.25 4.2c.415.332.657.835.657 1.367v7.019A1.75 1.75 0 0 1 13.25 15h-3.5a.75.75 0 0 1-.75-.75V9H7v5.25a.75.75 0 0 1-.75.75h-3.5A1.75 1.75 0 0 1 1 13.25V6.23c0-.531.242-1.034.657-1.366l5.25-4.2Zm1.25 1.171a.25.25 0 0 0-.312 0l-5.25 4.2a.25.25 0 0 0-.094.196v7.019c0 .138.112.25.25.25H5.5V8.25a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 .75.75v5.25h2.75a.25.25 0 0 0 .25-.25V6.23a.25.25 0 0 0-.094-.195Z"/></svg>
                            Home
                        </span>
                    </Link>
                    {session?.user?.login && (
                        <Link href={`/profile/${session.user.login}`} className="rounded-md px-3 py-2 text-sm text-git-muted hover:bg-git-card hover:text-git-text transition-colors">
                            <span className="flex items-center gap-2">
                                <svg height="16" viewBox="0 0 16 16" width="16" className="fill-current"><path d="M10.561 8.073a6.005 6.005 0 0 1 3.432 5.142.75.75 0 1 1-1.498.07 4.5 4.5 0 0 0-8.99 0 .75.75 0 0 1-1.498-.07 6.004 6.004 0 0 1 3.431-5.142 3.999 3.999 0 1 1 5.123 0ZM10.5 5a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"/></svg>
                                Profile
                            </span>
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
                                <span className="text-xs text-git-muted truncate">@{session.user.login}</span>
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
