import { auth, signOut } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";
import NotificationBell from "./NotificationBell";
import { MarkGithubIcon, HomeIcon, PersonIcon, GearIcon } from "@primer/octicons-react";

export default async function Sidebar() {
    let session = null;
    try {
        session = await auth();
    } catch {
        // auth() can fail during static generation
    }

    return (
        <aside className="hidden w-[275px] shrink-0 xl:block relative">
            <nav className="fixed w-[275px] top-0 flex flex-col h-screen px-4 pb-4">
                {/* logo — github filled octicon mark */}
                <div className="py-2">
                    <Link href="/" className="inline-flex items-center justify-center w-14 h-14 rounded-full hover:bg-white/10 transition-colors group">
                        <MarkGithubIcon size={30} className="fill-git-text group-hover:fill-git-accent transition-colors" />
                    </Link>
                </div>

                {/* nav links — filled octicon svgs */}
                <div className="flex flex-col gap-1 w-full mt-2">
                    <Link href="/" className="group flex items-center w-fit">
                        <div className="flex items-center gap-5 px-4 py-3 rounded-full hover:bg-git-hover transition-colors">
                            <HomeIcon size={24} className="fill-current" />
                            <span className="text-xl font-medium text-git-text">Home</span>
                        </div>
                    </Link>
                    
    {session?.user && (
        <div className="group flex items-center w-fit">
            <div className="flex items-center gap-5 px-4 py-3 rounded-full hover:bg-git-hover transition-colors">
                <NotificationBell />
            </div>
        </div>
    )}
                    
                    {session?.user?.login && (
                        <Link href={`/profile/${session.user.login}`} className="group flex items-center w-fit">
                            <div className="flex items-center gap-5 px-4 py-3 rounded-full hover:bg-git-hover transition-colors">
                                <PersonIcon size={24} className="fill-current" />
                                <span className="text-xl font-medium text-git-text">Profile</span>
                            </div>
                        </Link>
                    )}
                    
                    {session?.user && (
                        <Link href="/settings" className="group flex items-center w-fit">
                            <div className="flex items-center gap-5 px-4 py-3 rounded-full hover:bg-git-hover transition-colors">
                                <GearIcon size={24} className="fill-current" />
                                <span className="text-xl font-medium text-git-text">Settings</span>
                            </div>
                        </Link>
                    )}
                    
                    {/* post button */}
                    {session?.user && (
                        <div className="mt-4 px-2 mb-2">
                            <Link href="/" className="w-[60%] lg:w-[120px] bg-git-accent hover:opacity-90 text-white rounded-full py-2 px-4 font-semibold text-sm shadow-sm transition-colors flex items-center justify-center">
                                Post
                            </Link>
                        </div>
                    )}
                </div>

                {/* user card pill */}
                {session?.user && (
                    <div className="mt-auto mb-2 relative group w-full pr-4">
                        <div className="flex items-center justify-between p-3 rounded-full hover:bg-git-hover transition-colors cursor-pointer w-full mx-2">
                            <div className="flex items-center gap-3 overflow-hidden">
                                {session.user.image ? (
                                    <Image
                                        src={session.user.image}
                                        alt={session.user.login || "User"}
                                        width={40}
                                        height={40}
                                        className="rounded-full flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-git-border flex-shrink-0" />
                                )}
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-[15px] font-bold text-git-text truncate leading-tight">
                                        {session.user.name || session.user.login}
                                    </span>
                                    <span className="text-[15px] text-git-muted truncate leading-tight">
                                        @{session.user.login}
                                    </span>
                                </div>
                            </div>
                            <div className="text-git-text flex-shrink-0">
                                <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" className="fill-current"><path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"></path></svg>
                            </div>
                        </div>

                        {/* sign out dropdown */}
                        <div className="absolute bottom-full left-0 w-full pb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            <form action={async () => {
                                "use server";
                                await signOut({ redirectTo: "/login" });
                            }}>
                                <button type="submit" className="w-[85%] mx-auto block bg-git-bg border border-git-border shadow-[0_0_15px_rgba(255,255,255,0.1)] rounded-2xl px-4 py-3 text-left text-[15px] font-bold text-git-text hover:bg-git-card transition-colors">
                                    Log out @{session.user.login}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </nav>
        </aside>
    );
}
